# Play Console — respostas prontas para copiar

Versão consolidada em 01/10/2026, já com exclusão de conta, Groq, lembretes e 18+. Detalhes e fontes das regras: `docs/publicacao-play-store.md`.

Onde aparece **[URL ...]**, use os links do GitHub Pages depois que ele for ligado:
- Política: `https://bleer2004.github.io/ApsiCare/politica-de-privacidade.html`
- Exclusão de conta: `https://bleer2004.github.io/ApsiCare/exclusao-de-conta.html`

---

## 1. Criar app

| Campo | Resposta |
|---|---|
| Nome do app | ApsiCare |
| Idioma padrão | Português (Brasil) – pt-BR |
| App ou jogo | App |
| Gratuito ou pago | Gratuito |

## 2. Página principal da loja

**Nome (até 30):**
```
ApsiCare
```

**Descrição curta (até 80):**
```
Diário de humor e bem-estar com controle de estresse pelo smartwatch.
```
(A descrição completa foi reescrita em 06/10 com foco em bem-estar e controle de estresse; o texto atual está no Play Console.)

**Descrição completa (até 4000):**
```
O ApsiCare aproxima psicólogo e paciente entre uma sessão e outra. O paciente registra como está se sentindo, e o psicólogo acompanha a evolução com dados organizados, em vez de depender só da memória da semana.

PARA O PACIENTE
• Diário de humor: escolha como você está, dê uma nota para o seu dia e escreva ou grave por voz o que aconteceu.
• Você decide o que compartilhar: só as anotações enviadas ao psicólogo ficam visíveis para ele.
• Smartwatch: com o Android Health Connect, o app lê sua frequência cardíaca (somente leitura) e mostra uma estimativa diária de estresse.
• Lembretes do seu psicólogo direto no celular.
• Exercício de respiração guiada antes de escrever no diário.
• Acessibilidade: modo de baixa visão e modo para daltonismo.

PARA O PSICÓLOGO
• Painel com todos os pacientes e alertas quando os indicadores de estresse sobem.
• Histórico de humor, anotações compartilhadas e relatório semanal de cada paciente.
• Notificação quando o paciente compartilha uma anotação.
• Envio de lembretes, metas e documentos para o paciente.

COMO FUNCIONA O ACESSO
O psicólogo cria a conta no app e cadastra seus pacientes. O paciente recebe um convite por e-mail e cria a própria senha no primeiro acesso.

INTELIGÊNCIA ARTIFICIAL
O texto do diário é analisado por um serviço de IA de terceiros para estimar sentimento e estresse, e a gravação de voz é transcrita por outro serviço. Os dados do smartwatch não são enviados para IA. Veja todos os detalhes na Política de Privacidade.

PRIVACIDADE
Seus dados não são vendidos nem usados para publicidade. Você pode pedir a exclusão da sua conta e de todos os seus dados dentro do app.

AVISO IMPORTANTE
O ApsiCare não é um dispositivo médico e não diagnostica, trata, cura ou previne nenhuma condição de saúde. As estimativas de estresse são automatizadas e não substituem a avaliação de um profissional. Não é um serviço de emergência: em caso de crise, ligue para o CVV (188, 24h e gratuito) ou para o SAMU (192).

O ApsiCare é um projeto acadêmico (Trabalho de Conclusão de Curso), destinado a maiores de 18 anos.
```

## 3. Configurações da loja

| Campo | Resposta |
|---|---|
| Categoria | Saúde e fitness |
| Tags | Saúde mental, Bem-estar, Diário (escolha as que a Play oferecer mais próximas) |
| E-mail | apsicare.noreply@gmail.com |
| Site | (opcional) `https://bleer2004.github.io/ApsiCare/` |
| Telefone | (deixe em branco) |

## 4. Conteúdo do app (Política → Conteúdo do app)

### 4.1 Política de privacidade
```
[URL da política]
```

### 4.2 Acesso ao app
Marque **"Todas ou algumas funcionalidades são restritas"** e crie **duas** instruções. **Preencha as senhas só no Play Console**, nunca neste arquivo (o repositório é público).

**Instrução 1, psicólogo:**
- Nome: `Conta de psicólogo (demonstração)`
- Usuário: e-mail da conta demo de psicólogo
- Senha: (no Play Console)
- Outras informações:
```
Na tela inicial, toque em "Iniciar" e escolha "Psicólogo". Após o login, a Visão Geral mostra os pacientes; toque em um paciente para ver humor, anotações compartilhadas, dados do smartwatch e relatório semanal. Configurações tem a opção "Excluir conta".
```

**Instrução 2, paciente:**
- Nome: `Conta de paciente (demonstração)`
- Usuário: e-mail de uma conta demo de paciente (ex.: Lara ou Carlos)
- Senha: (no Play Console)
- Outras informações:
```
Na tela inicial, toque em "Iniciar" e escolha "Paciente". O Diário registra humor e anotações (texto ou voz). "Meus dados" conecta o smartwatch via Health Connect (somente leitura de frequência cardíaca); sem relógio pareado, o app avisa que não há medições. "Meus dados" também tem "Solicitar exclusão dos meus dados".
```

### 4.3 Anúncios
**Não**, o app não contém anúncios.

### 4.4 Classificação de conteúdo (IARC)
| Pergunta | Resposta |
|---|---|
| Categoria | Todos os outros tipos de app |
| Violência, sexo, palavrões, drogas, apostas | Não |
| Usuários interagem ou trocam conteúdo? | **Sim** (paciente compartilha anotações com o psicólogo vinculado; não há chat público) |
| Compartilha a localização? | Não |
| Compras digitais? | Não |

### 4.5 Público-alvo
- Faixa etária: **somente 18 anos ou mais**.
- Pode atrair crianças sem querer? **Não**.

### 4.6 App de notícias / Governamental / Recursos financeiros
Não / Não / Nenhum.

### 4.7 ID de publicidade
**Não**, o app não usa ID de publicidade (a permissão `AD_ID` foi bloqueada no manifest).

### 4.8 Declaração de apps de saúde
Marque **só**:
- **Saúde e fitness → Controle de estresse, relaxamento e acuidade mental**

**Não marque "Medicina → Saúde mental e comportamental"**: em 05/10/2026 a Google recusou o app por isso ("alguns tipos de apps só podem ser distribuídos por organizações"). Essa categoria exige conta de organização, e a nossa é pessoal.

Não marque "Pesquisa com seres humanos", a menos que o TCC tenha aprovação de comitê de ética com participantes reais.

> Atenção: se a revisão exigir **conta de organização** por causa da categoria Medicina, a saída é publicar pela conta da instituição ou manter só em teste interno/fechado (ver seção 6.3 do guia).

### 4.9 Permissões de saúde (Health Connect)
- Tipo de dado: **Frequência cardíaca — leitura**. Nada mais.
- Funcionalidade: a mesma da 4.8.
- Justificativa (o formulário costuma aceitar em inglês, que acelera a análise):
```
ApsiCare reads heart rate records from the last 24 hours in Health Connect, only after the user taps "Connect smartwatch" on the "My data" screen. Heart rate is used to compute a daily physiological stress estimate (average BPM and HRV-derived metrics), shown to the user and to the psychologist the user is linked to, to support ongoing psychological follow-up. Samples are aggregated per minute and sent over HTTPS to our backend (AWS, São Paulo region). Health Connect data is never sold, never used for advertising, and never sent to AI providers. Users can delete their account and all associated data from inside the app.
```
- URL da política: `[URL da política]` (o link "política de privacidade" dentro do Health Connect já abre a política no app).

## 5. Segurança dos dados (Data Safety)

**Perguntas gerais**
| Pergunta | Resposta |
|---|---|
| O app coleta ou compartilha dados de usuário? | Sim |
| Todos os dados são criptografados em trânsito? | Sim |
| Os usuários podem pedir que os dados sejam excluídos? | Sim |
| URL para pedido de exclusão | `[URL de exclusão de conta]` |
| Conta: o app permite criar conta? | Sim, com nome de usuário e senha |
| Excluir conta: link | `[URL de exclusão de conta]` |

**Tipos de dados.** Em todos: Compartilhado = **Não** (AWS, OpenRouter, Groq e Expo/FCM são prestadores de serviço) e nada de "Publicidade" ou "Análise".

| Categoria → tipo | Coletado | Obrigatório? | Processado temporariamente? | Finalidades |
|---|---|---|---|---|
| Informações pessoais → Nome | Sim | Obrigatório | Não | Funcionalidade do app; Gerenciamento da conta |
| Informações pessoais → Endereço de e-mail | Sim | Obrigatório | Não | Funcionalidade do app; Gerenciamento da conta; Comunicações do desenvolvedor |
| Informações pessoais → Número de telefone | Sim | Obrigatório | Não | Funcionalidade do app |
| Informações pessoais → Outras informações | Sim | Opcional | Não | Funcionalidade do app (data de nascimento, registro profissional, contato de emergência) |
| Saúde e fitness → Informações de saúde | Sim | Opcional | Não | Funcionalidade do app; Personalização |
| Saúde e fitness → Informações de condicionamento físico | Sim | Opcional | Não | Funcionalidade do app |
| Mensagens → Outras mensagens no app | Não | — | — | — |
| Arquivos de áudio → Gravações de voz ou som | Sim | Opcional | **Sim** (só transcrito, não é guardado) | Funcionalidade do app |
| Atividade no app → Outro conteúdo gerado pelo usuário | Sim | Opcional | Não | Funcionalidade do app (texto do diário, metas) |
| Arquivos e documentos → Arquivos e documentos | Sim | Opcional | Não | Funcionalidade do app (documentos anexados pelo psicólogo) |
| IDs do dispositivo ou outros IDs | Sim | Opcional | Não | Funcionalidade do app (token de notificação push) |
| Fotos e vídeos | Não | — | — | — (a foto de perfil do psicólogo fica só no aparelho) |
| Localização, Contatos, Financeiro, Navegação, Diagnósticos do app | Não | — | — | — |

## 6. Teste interno

**Notas da versão (pt-BR):**
```
Primeira versão de teste do ApsiCare: diário de humor com voz, integração com smartwatch via Health Connect, painel do psicólogo, lembretes e exclusão de conta.
```

**Mensagem para os testadores (WhatsApp/e-mail):**
```
Oi! Estou testando o ApsiCare, o app do meu TCC, e queria sua ajuda.
1. Abra este link no celular Android, com a mesma conta Google que você me passou: [LINK DE PARTICIPAÇÃO]
2. Toque em "Aceitar convite" e depois em "Baixar na Google Play".
3. Entre com a conta que eu te mandar e use o app normalmente por alguns dias.
Se algo der errado, me conta (ou use "Enviar feedback" na própria página do app na Play Store). Obrigada!
```

## 7. Capturas de tela (mínimo 2, ideal 4 a 8)

Tire no celular, com **contas demo** (nunca dados de pacientes reais):
1. Tela inicial (escolha Psicólogo/Paciente)
2. Home do paciente com o gráfico de humor
3. Diário com emoji e anotação
4. "Meus dados" com smartwatch conectado e BPM
5. Visão Geral do psicólogo
6. Perfil do paciente visto pelo psicólogo (gráfico semanal)

Ainda faltam (dependem do ícone): ícone 512×512 (`assets/play-store-icon-512.png`, gerado a partir do ícone final) e gráfico de recurso 1024×500.
