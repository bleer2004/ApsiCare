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

### Pipeline de insight (`lambdas/gerar-insight/index.py`)

- Mapeia sujeitos do dataset acadêmico **WESAD** (S14/S16/S17) para "perfis" psicológicos fixos (`hiperreativo`/`dissociativo`/`neutro`) via `PERFIS_WESAD`, usados nas **contas demo** do TCC.
- Resolve `wesad_id` a partir do campo `wesadId` no perfil do paciente. **Se `wesadId` estiver vazio (paciente real), cai automaticamente no fallback de usar a própria PK** — ou seja, o pipeline já funciona com dados reais sem mudança de código, basta gravar `HEALTH_BATCH#` com `dataPoints` contendo `hr`/`ibi`/(`temp` opcional) sob a PK do próprio paciente.
- Calcula RMSSD internamente a partir da lista de IBIs (`calc_rmssd`) — quem grava dados não precisa calcular RMSSD, só mandar `hr`/`ibi`.
- `ss = 0.30` (stress subjetivo) está **hardcoded** no insight diário — não vem de dados reais de humor ainda.

### Endpoints de ingestão

- `health-ingest`: `POST {userId, samples: [...]}` → 1 write (`HEALTH_BATCH#`). Preferir este para qualquer sync em lote.
- `registrar-physio`: 1 write por amostra (`PHYSIO#`) — mais caro, evitar para sync frequente.

## Convenções a manter

- Sem validação de schema/JWT em lambdas de dados — não adicionar isoladamente sem o usuário pedir, para não quebrar consistência com o resto do backend.
- Sem comentários longos / documentação extensa em código — preferir nomes claros.
- Pacotes nativos (ex.: Health Connect) exigem development build (EAS) — Expo Go não roda módulos nativos customizados.

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
