# PsicoCare

App de TCC: acompanhamento psicológico conectando psicólogo e paciente, com geração de insights a partir de dados fisiológicos (smartwatch / Health Connect).

## Stack

- **Frontend**: React Native + Expo (managed workflow), SDK ~54, React Native 0.81.5, React 19.1.0. NÃO é Flutter nem nativo puro.
- **Backend**: AWS Lambda (Node.js ESM + um lambda em Python) + API Gateway, sem framework tipo Express/NestJS. Deploy manual via zips em `lambdas/zips/` (sem SAM/CDK/Serverless Framework — infra não versionada em código).
- **Banco**: AWS DynamoDB, tabela única `ApsiCare` (single-table design), região `sa-east-1`, chaves `PK`/`SK`. Sem ORM — cada lambda instancia seu próprio client (`@aws-sdk/client-dynamodb` + `lib-dynamodb` no Node; `boto3.resource("dynamodb")` no Python).
- **Auth**: JWT (`jsonwebtoken`), emitido só em `lambdas/login` (clínico) e `lambdas/login-patient` (paciente). Token + `user` ficam em `AsyncStorage` no app. **Nenhum outro lambda valida o JWT hoje** — é assim em todo o backend, não é descuido isolado.

## Estrutura do app (duas "metades" no mesmo App.js raiz)

- `src/` — lado do **psicólogo/clínico**: telas, navegação (`src/navigation/App.js`), `src/services/api.ts` (exporta só `API_URL`).
- `paciente/src/` — lado do **paciente**: telas próprias (`paciente/src/screens/*.js`), reaproveita `src/services/api.ts` via import relativo.
- `psico-base/` — esqueleto Expo solto/leftover, **não é o app real**, não confundir.
- `android/` — pasta de projeto nativo Android, historicamente incompleta (sem manifest/gradle até o primeiro `expo prebuild`).
- Sem Redux/Context/React Query — cada tela faz `fetch` direto com `AsyncStorage.getItem('token')`/`'user'` e chama `${API_URL}/...`.

## Backend / dados

Itens DynamoDB relevantes (`PK`/`SK`):
- `PATIENT#<id>` / `PATIENT#<id>` — perfil do paciente (inclui campo opcional `wesadId`).
- `PATIENT#<id>` / `HEALTH_BATCH#<batchId>` — lote de amostras fisiológicas (`lambdas/health-ingest`, 1 write por sync).
- `PATIENT#<id>` / `PHYSIO#<measuredAt>` — amostra individual (`lambdas/registrar-physio`, 1 write por amostra — mais caro, evitar).
- `PATIENT#<id>` / `MOOD#<timestamp>` — humor/diário (`lambdas/registrar-mood`).
- `PATIENT#<id>` / `INSIGHT#<timestamp>` — insight gerado (`lambdas/gerar-insight` escreve, `lambdas/listar-insights` lê).
- `PATIENT#<wesadId>` / `DAILY_NPS#<date>` — dados diários agregados do dataset WESAD (só contas demo).
- `CLINICIAN#<id>` / `NOTIFICATION#<timestamp>` — notificação in-app do clínico (`category`, `title`, `body`, `isRead`, `pushSent`, `patientId`, `patientName`, `relatedId`). Ver seção "Notificações push".

### Pipeline de insight (`lambdas/gerar-insight/index.py`)

- Mapeia sujeitos do dataset acadêmico **WESAD** (S14/S16/S17) para "perfis" psicológicos fixos (`hiperreativo`/`dissociativo`/`neutro`) via `PERFIS_WESAD`, usados nas **contas demo** do TCC.
- Resolve `wesad_id` a partir do campo `wesadId` no perfil do paciente. **Se `wesadId` estiver vazio (paciente real), cai automaticamente no fallback de usar a própria PK**.
- Calcula RMSSD internamente a partir da lista de IBIs (`calc_rmssd`) — quem grava dados não precisa calcular RMSSD, só mandar `hr`/`ibi`.
- Stress fisiológico usa **thresholds absolutos** de HRV (Shaffer & Ginsberg 2017): HR 50–110bpm, IBI 545–1200ms, RMSSD 10–60ms (normalização relativa ao batch foi removida — era bug). RMSSD é invertido na fórmula (RMSSD alto = relaxamento).
- Stress subjetivo (`ss`) combina 4 parâmetros com pesos: `0.30 × emocao + 0.20 × humor + 0.20 × impacto + 0.30 × texto_llm`. O `texto_llm` vem da análise do diário via LLM (OpenRouter + Llama 3.2 1B). Fallback para 0.5 se LLM indisponível.

### Pipeline LLM — análise de texto e voz (implementado 2026-07, modelo trocado 2026-08-04)

Dois lambdas novos em Python:
- `lambdas/analisar-texto/index.py` — `POST /analisar-texto`: recebe `{ diaryText }`, chama OpenRouter (`meta-llama/llama-3.1-8b-instruct`), devolve `{ stress_score, sentimento, palavras_chave }`. Variável de ambiente: `OPENROUTER_API_KEY`.
- `lambdas/transcrever-voz/index.py` — `POST /transcrever-voz`: recebe `{ audio_base64 }` (WAV), chama HuggingFace Inference API (Whisper Large V3, gratuito), devolve `{ text }`. Variável de ambiente: `HF_TOKEN`.

**Bug corrigido (2026-08-04):** modelo original (`meta-llama/llama-3.2-1b-instruct`) retornava `stress_score` sempre igual, não importa o texto. Causa raiz em duas partes: (1) o prompt continha um exemplo de JSON com valores numéricos concretos (`0.73`, `"negativo"`, etc.) e o modelo simplesmente copiava o exemplo literalmente — corrigido trocando por placeholders (`<número entre 0.0 e 1.0 calculado agora>`); (2) mesmo depois disso, o 1B continuava "chutando" `stress_score: 0.5` sempre — confirmado adicionando um campo temporário `_debug_raw` na resposta pra inspecionar o JSON bruto do modelo (removido depois do diagnóstico). Modelos de 1B parâmetro são fracos em gerar um float contínuo coerente; `sentimento` e `palavras_chave` (classificação categórica/extração) sempre funcionaram bem, só o score numérico era ruim. Solução: trocado para `meta-llama/llama-3.1-8b-instruct` — custo desprezível (~$0.000016/chamada) dado o crédito disponível na conta OpenRouter.

**Histórico de bug (2026-08-16, resolvido):** `gerar-insight/index.py` tinha sua própria função duplicada (`analisar_texto_llm`), reimplementando a mesma lógica de `analisar-texto/index.py` de forma independente. Isso causou divergência: quando o bug do exemplo numérico e o ZDR foram corrigidos em `analisar-texto` (04/08 e 09/08), a cópia dentro de `gerar-insight` — que é a que rodava de verdade na geração de insight real dos pacientes — ficou pra trás. Corrigido trocando a duplicação por uma única implementação real usada nos dois lugares.

**Como a chamada é feita (2026-08-23, ajustado):** a primeira correção usava `boto3 lambda_client.invoke` (lambda chamando lambda diretamente) — mas isso exige uma permissão IAM (`lambda:InvokeFunction`) na role de execução do `gerar-insight`, e o professor informou que o serviço IAM não é liberado pra alunos no ambiente AWS acadêmico. Solução final: `gerar-insight` chama o endpoint HTTP público do `analisar-texto` (`POST {API_URL}/analisar-texto`, via `urllib.request`, mesmo padrão já usado pra chamar a OpenRouter) em vez de invocação direta — uma chamada HTTP normal não exige nenhuma permissão especial de IAM. `API_URL` tem fallback hardcoded pro endpoint atual, mas pode ser sobrescrito por env var `API_URL` se a API mudar de domínio. `gerar-insight` não usa mais `OPENROUTER_API_KEY` diretamente (só `analisar-texto` usa agora) — pode remover essa env var do `gerar-insight` na AWS, não é obrigatório mas não é mais necessária ali.

**LGPD / dados sensíveis (2026-08-05):** cogitado usar Gemini Nano (on-device, via ML Kit GenAI/AICore) pra manter o texto do diário no próprio celular sem passar por nuvem, mas descartado — exigiria development build + módulo nativo Android, só funciona em aparelhos com suporte a AICore. Implementado em vez disso:
- **Tela de consentimento** em `paciente/src/screens/DiarioPaciente.js`: no primeiro acesso ao Diário, mostra um modal explicando que o texto/voz é enviado a serviços de IA de terceiros (OpenRouter para análise de sentimento/estresse, Groq para transcrição de voz) antes de liberar a tela. Aceite salvo em `AsyncStorage` (`diarioLgpdConsent`), não repete depois da primeira vez. Modal roda antes do modal de respiração já existente.
- **ZDR validado empiricamente (2026-08-16, ver `docs/teste.txt`):** não existe um toggle de "ativar ZDR" separado no painel da OpenRouter — a seção "Data Training" do painel é outra coisa (o próprio painel avisa isso). ZDR é controlado só pelo parâmetro `provider: {zdr: true}` por requisição, que o código já usa (com fallback se não achar endpoint elegível). Testado via Postman contra `/analisar-texto`: `zdr_aplicado: true` em 2 chamadas reais com textos diferentes — funcionando de verdade, não é só tentativa. Não é mais pendência.
- **Pendente ainda:** documentar transferência internacional de dados (LGPD Art. 33) como limitação conhecida no texto do TCC.

Fluxo de voz no app: paciente grava → `transcrever-voz` (Whisper) → texto aparece no campo do diário pra revisar → salva como `diaryText` → na geração de insight, `gerar-insight` chama OpenRouter internamente e incorpora o score na fórmula.

**Frontend** — `paciente/src/screens/DiarioPaciente.js`:
- Botão "Gravar voz" ao lado do título "Anotações do dia" (Android only).
- Grava com `expo-av`, converte pra base64, envia ao `/transcrever-voz`, texto transcrito preenche o campo automaticamente (append se já havia texto).
- iOS mostra mensagem de indisponível.

### Endpoints de ingestão

- `health-ingest`: `POST {userId, samples: [...]}` → 1 write (`HEALTH_BATCH#`). Preferir este para qualquer sync em lote.
- `registrar-physio`: 1 write por amostra (`PHYSIO#`) — mais caro, evitar para sync frequente.

### Edição de paciente (achado em auditoria de contrato frontend×backend, 2026-08-23 — não existiam lambdas pra essas rotas)

- `lambdas/get-paciente/index.js` — `GET /clinicians/patients/{id}`, lê `PATIENT#<id>`/`PATIENT#<id>`. Usado pelo modal "Editar Paciente" em `src/screens/userPorfile/perfilUsuario.js`.
- `lambdas/atualizar-paciente/index.js` — `PUT /clinicians/patients/{id}` `{name, email, phone, birthDate, diagnostico, observacoes}`. **Atualiza dois itens**: o perfil canônico (`PATIENT#<id>`/`PATIENT#<id>`) e o item "link" duplicado sob o clínico (`CLINICIAN#<clinicianId>`/`PATIENT#<id>`, escrito originalmente por `cadastro-patient`) — é esse segundo item que `listar-patients` lê pra montar a lista de pacientes, então sem essa sincronia a edição não apareceria lá.

### Configurações de acessibilidade do paciente (mesma auditoria, mesma causa)

- `lambdas/get-configuracoes-paciente/index.js` — `GET /patients/{patientId}/configuracoes`, retorna `{ configuracoesApp }` (objeto genérico, hoje só usado pra `acessibilidade: {baixaVisao, daltonismo}`).
- `lambdas/atualizar-configuracoes-paciente/index.js` — `PUT /patients/{patientId}/configuracoes` `{configuracoesApp}`, sobrescreve o campo inteiro no perfil do paciente. Usado por `paciente/src/contexts/AccessibilityContext.js` e `paciente/src/screens/perfilPaciente.js` — antes dessa lambda existir, a sincronização falhava silenciosamente (fallback pro `AsyncStorage` local já existia, então não travava o app, só nunca persistia no servidor).

### Notificações push (parte 1: 2026-08-09, parte 2: 2026-08-15)

Push notifications via Expo Push Service (`exp.host`), só **Android** — iOS exigiria Apple Developer Program pago (US$99/ano), fora do escopo (mesma decisão já tomada pra Health Connect/gravação de voz: recurso Android-only, iOS mostra indisponível). Só o **clínico** recebe push hoje; não existe notificação para o paciente ainda.

**Setup obrigatório fora do código (Firebase/FCM), sem isso `getExpoPushTokenAsync()` falha sempre com `E_REGISTRATION_FAILED` num build standalone (Expo Go não precisa disso, só falha em APK real):**
1. Projeto no Firebase Console + app Android `com.vewadie.apsicare` → `google-services.json` na raiz do repo (`!google-services.json` no `.gitignore`, que por padrão ignora `*.json` — chave da API do Google não é secreta, é restrita por package/SHA, então pode ficar versionado).
2. `app.json` → `expo.android.googleServicesFile: "./google-services.json"` (aplica o plugin `com.google.gms.google-services` automaticamente no `expo prebuild`, sem precisar mexer em gradle na mão).
3. Firebase Console → Configurações do projeto → Contas de serviço → gerar chave privada → upload dessa chave em expo.dev (`accounts/ve_wadie/projects/apsicare/credentials` → Android → FCM V1 service account key). Sem isso o Expo não consegue *entregar* o push mesmo com o app registrando token certinho.
4. Depois de mexer em `app.json`/gradle: `npx expo prebuild --platform android` de novo + `cd android && ./gradlew assembleRelease` pra gerar um APK novo.

**Bug conhecido, não corrigido (não é nosso código):** o plugin da lib `react-native-health-connect` duplica o `<intent-filter>` de `ACTION_SHOW_PERMISSIONS_RATIONALE` no `AndroidManifest.xml` toda vez que roda `expo prebuild` (não é idempotente). Cosmético — Android tolera duplicata, não afeta funcionamento — não vale a pena patchar lib de terceiro por isso.

**Backend:**
- `lambdas/registrar-push-token/index.js` — `POST /push-token` `{userId, userType, pushToken}`, salva `pushToken` no perfil (`PATIENT#`/`PROFILE` ou `CLINICIAN#`/`PROFILE`). Chamado no login (`registerForPushNotificationsAsync` em `src/services/api.ts`), tanto paciente quanto clínico pedem permissão e registram token, mas só o clínico de fato recebe push hoje.
- `lambdas/compartilhar-mood/index.js` e `lambdas/gerar-insight/index.py` disparam push + gravam `NOTIFICATION#` pro clínico dono do paciente: `compartilhar-mood` quando o paciente compartilha uma anotação do diário (`category: share_alert`); `gerar-insight` quando o flag de um paciente **passa a ser** `anxiety_risk` (só na transição, não repete todo dia com o mesmo flag) (`category: risk_alert`).
- **Importante:** em ambos, todo o bloco de notificação (busca de clínico, envio de push, gravação do item) está isolado num `try/catch`/`try/except` próprio, separado do fluxo principal — se a notificação falhar por qualquer motivo (token inválido, Dynamo fora do ar, etc.), o compartilhamento/geração de insight continua retornando sucesso normalmente, só loga o erro. Decisão explícita: notificação nunca pode quebrar o fluxo principal.
- Ambos checam `clinician.notificationsEnabled !== false` antes de notificar (default ligado se o campo não existir ainda).
- `lambdas/listar-notificacoes/index.js` — `GET /clinicians/{clinicianId}/notifications`, até 50 mais recentes.
- `lambdas/marcar-notificacao-lida/index.js` — `PATCH /clinicians/{clinicianId}/notifications/{notificationId}/read`.
- `lambdas/atualizar-clinician/index.js` — aceita `notificationsEnabled` no PUT do perfil (toggle em Configurações).

**Frontend:**
- `src/screens/notificacoes/NotificacoesPsicologo.js` (tela nova, registrada em `App.js`) — lista as notificações do clínico, toque marca como lida e navega pro paciente relacionado (busca o paciente completo via `GET /clinicians/{id}/patients`, já que `DashboardPaciente` espera o objeto `paciente` inteiro via `route.params`, não um id solto).
- `src/screens/visionBoard/visaoGeral.js` — sino no header com badge de não lidas, recarrega notificações toda vez que a tela ganha foco. Card "Urgências" (que antes tinha a lista sempre vazia, mock removido sem substituto) agora é populado com os `NOTIFICATION#` de `category: risk_alert` reais.
- `src/screens/Configs/configuracoes.js` — switch "Notificações" agora persiste de verdade (`notificationsEnabled`) via o PUT existente de perfil do clínico; antes era só estado local sem efeito.

**Pendências conhecidas:**
- Toggle "Notificações" desligado impede o *backend* de mandar push/gravar notificação nova, mas não desregistra o token nem revoga a permissão do SO — se o clínico reativar o toggle sem reinstalar o app, volta a funcionar sem precisar logar de novo (comportamento esperado, mas vale checar).
- Sem notificação nenhuma pro lado do paciente ainda (ex.: lembrete de diário, resposta do clínico).
- `deploy manual`: os 2 lambdas novos (`listar-notificacoes`, `marcar-notificacao-lida`) e as 2 novas rotas de API Gateway (`GET /clinicians/{clinicianId}/notifications`, `PATCH /clinicians/{clinicianId}/notifications/{notificationId}/read`) ainda precisam ser criados manualmente no console AWS — zips já estão prontos em `lambdas/zips/`.

## Convenções a manter

- Sem validação de schema/JWT em lambdas de dados — não adicionar isoladamente sem o usuário pedir, para não quebrar consistência com o resto do backend.
- Sem comentários longos / documentação extensa em código — preferir nomes claros.
- Pacotes nativos (ex.: Health Connect, expo-av) exigem development build (EAS) — Expo Go não roda módulos nativos customizados.
- Lambdas Python precisam ter handler configurado como `index.handler` no console da AWS (padrão da AWS é `lambda_function.lambda_handler` e quebra).
- Variáveis de ambiente dos lambdas LLM: `OPENROUTER_API_KEY` em `analisar-texto` e `gerar-insight`; `HF_TOKEN` em `transcrever-voz`.

## Status: integração Health Connect — CONCLUÍDA e validada ponta a ponta (2026-06-18 a 2026-06-22)

Objetivo alcançado: o paciente conecta o smartwatch de verdade (via Android Health Connect) na tela "Meus dados", os batimentos reais são lidos automaticamente, enviados ao backend e alimentam a geração de insight (físico + subjetivo via humor do diário) — substituindo a simulação total que existia antes. Testado de ponta a ponta num Samsung Galaxy S25+ (Android 15) com medições reais.

### Como funciona hoje

**App (paciente)** — `src/screens/smartwatch/SmartWatchPaciente.js` (componente reaproveitado, antes 100% mockado) embutido em `paciente/src/screens/perfilPaciente.js` (tela "Meus dados"):
- Ao abrir a tela, verifica se a permissão do Health Connect já foi concedida antes (`hasHeartRatePermission`); se sim, sincroniza automaticamente e em silêncio (sem alertas) — não precisa clicar em nada.
- "Conectar Smartwatch" pede a permissão real (`requestHeartRatePermission`); se o Health Connect não estiver instalado, oferece abrir a Play Store.
- "Sincronizar Agora" lê `HeartRateRecord` das últimas 24h (`readHeartRateSince`), aproxima `ibi_ms = 60000/bpm` (Health Connect não expõe IBI real — limitação documentada, relevante pro texto do TCC), envia pro backend (`POST /health`), gera/atualiza o insight do dia (`POST /patients/{id}/insights/generate`) e mostra o **BPM da leitura mais recente** + nível de stress vindo do insight gerado.
- Se não houver nenhuma medição no Health Connect, mostra aviso explícito: "meça sua frequência cardíaca no relógio primeiro".
- Passos e calorias foram **removidos completamente** da UI (não são coletados).
- Em iOS mostra "recurso não disponível" sem chamar nada nativo (Health Connect é Android-only).

**App (psicólogo)** — `src/screens/userPorfile/perfilUsuario.js`:
- Card "Smartwatch" mostra BPM médio do dia, nível de stress, RMSSD e perfil, com "Última sincronização" (data/hora corrigida de UTC pra horário local) e quantas leituras entraram na média.
- Gráfico "Correlação Semanal" agora pode mostrar dados reais do paciente (não só das contas demo WESAD) — usa o relatório semanal real.
- "Gerar Relatório"/"Analisar com IA" (mesmo botão em dois lugares) gera o relatório semanal agregando os insights diários reais da semana, pra pacientes sem `wesadId`.

**Backend** — `lambdas/gerar-insight/index.py`:
- Insight diário: 1 registro por paciente por dia (sincronizar várias vezes no mesmo dia **atualiza** o registro existente, não cria um novo — decisão tomada pra fazer sentido como acompanhamento clínico contínuo).
- Stress subjetivo (`ss`) agora vem do humor real mais recente registrado no Diário (emoji + slider), via `calc_stress_subjetivo` (`1 - emotionalScore/100`); cai pra 0.30 só se não houver nenhum humor registrado ainda.
- Relatório semanal: contas demo (`wesadId` setado) continuam usando o dataset WESAD (`DAILY_NPS#`) intocado; pacientes reais agregam os insights diários reais da última semana.
- `lambdas/listar-insights/index.js` expõe `stress_subj`, `amostras` e `dias` (necessários pro app).

### Bugs encontrados e corrigidos durante o teste real (histórico, não precisa repetir)

1. **Crash ao pedir permissão** (`lateinit property requestPermission has not been initialized`) — faltava registrar `HealthConnectPermissionDelegate.setPermissionDelegate(this)` no `MainActivity.kt`. Corrigido via config plugin local `plugins/withHealthConnectMainActivity.js` (sobrevive a `expo prebuild`, que sobrescreve `MainActivity.kt` toda vez).
2. **Tela de permissão fechava sozinha em ~20ms** sem mostrar nada, retornando permissão vazia sem erro — faltava um SEGUNDO intent-filter no manifest, exigido pelo Android 14+ (`android.intent.action.VIEW_PERMISSION_USAGE` + categoria `android.intent.category.HEALTH_PERMISSIONS`, diferente do `ACTION_SHOW_PERMISSIONS_RATIONALE` que só vale até Android 13). Corrigido no mesmo plugin. (Hipótese descartada no caminho: New Architecture — `newArchEnabled: false` ficou em `app.json`, não é a causa de nada, pode reverter sem pressa.)
3. **Rota errada**: código assumia `/health-ingest`, a rota real no API Gateway é `POST /health`.
4. **Timezone**: backend salva timestamps em UTC sem marcar isso — o app agora soma o "Z" explicitamente antes de formatar, senão mostrava ~3h adiantado.
5. **Relatório semanal confundindo insight diário com relatório semanal** (os dois usam os mesmos campos de categoria/data) — causava 0%/0%/0% e gráfico vazio. Corrigido distinguindo pela presença do campo `dias` (só relatórios semanais têm).
6. **"Mais recente" pegando o relatório semanal em vez do insight diário** nas telas do paciente e do psicólogo (mesmo problema de raiz do item 5, em outro lugar) — corrigido filtrando explicitamente por `!insight.dias` (diário) ou `insight.dias` (semanal) em vez de assumir `insights[0]`.

### Build de produção (sem cabo/Metro)

Gerada via `cd android && ./gradlew assembleRelease` — usa a keystore debug pra assinatura (aceitável, já que não vai pra Play Store, só instalar direto no celular). APK final em `android/app/build/outputs/apk/release/app-release.apk` — instala uma vez via `adb install` e funciona sozinho, sem precisar do Metro/notebook ligado (só precisa de internet pra falar com a API).

### Pendências conhecidas, não bloqueantes

- `newArchEnabled: false` em `app.json` — pode reverter pra `true` num momento sem pressa.
- `hora_para_label()` (que decide se o texto do insight diz "[manhã]"/"[tarde]"/"[noite]") usa `datetime.now().hour` no backend, que roda em UTC — o texto pode dizer o período errado em relação ao horário de Brasília (cosmético, não afeta os números). Não corrigido ainda.
- `gerar_insight_handler` lê só os últimos 10 `HEALTH_BATCH#` — se o paciente sincronizar mais de 10x num único dia, sincronizações mais antigas daquele dia somem do cálculo. Não é problema no uso normal (poucas sincronizações por dia).
- Teste explícito de "negar permissão → volta pra desconectado sem travar" não foi feito na prática, mas o código já trata esse caminho.
</content>
