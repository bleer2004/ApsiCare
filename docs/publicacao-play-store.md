# Guia de publicação do ApsiCare na Google Play Store

**Data de referência:** 30/09/2026. As regras da Google Play mudam com frequência; confira os links oficiais da seção 10 antes de cada etapa.

Package: `com.vewadie.apsicare` · Nome: `Apsicare` · Conta Expo: `ve_wadie` · Expo SDK 54 / React Native 0.81.5.

---

## 0. Aviso urgente: verificação de desenvolvedor Android no Brasil (a partir de hoje)

A partir de **30/09/2026**, em aparelhos Android certificados no **Brasil** (e em Indonésia, Singapura e Tailândia), só instalam apps cujo package esteja registrado por um desenvolvedor verificado. Segundo a documentação: *"Any package names not registered by this date will no longer be installable on certified Android devices in those regions."*

O que isso muda para o ApsiCare:

- O APK que é instalado hoje via `adb install` / arquivo, assinado com a **keystore debug**, pode deixar de instalar em celulares no Brasil, inclusive no dia da banca do TCC.
- A keystore `android/app/debug.keystore` é a keystore padrão do template React Native (senha `android`), a mesma em milhares de projetos. **Não registre o package com ela.** Gere primeiro a sua keystore própria (seção 3.1) e use essa.
- Caminhos possíveis:
  1. **Publicar pela Play Console** (este guia). A Google registra automaticamente os apps distribuídos pela Play. Até para o **teste interno**, que já serve para a demonstração do TCC.
  2. **Conta de distribuição limitada** (gratuita, sem documento oficial, até **20 aparelhos** autorizados via QR code/link). Pensada para estudantes e hobbystas. Serve como plano B para continuar instalando o APK fora da Play.
  3. O "advanced flow" (instalar app não verificado passando por avisos) existe para usuários avançados, mas não é algo para pedir a um paciente ou a uma banca.

Fontes: [Android developer verification](https://developer.android.com/developer-verification) · [Limited distribution accounts](https://developer.android.com/developer-verification/guides/limited-distribution)

---

## 1. Visão geral e prazos realistas

Fluxo para uma **conta pessoal nova** (criada depois de 13/11/2023):

```
Conta Play Console (US$ 25) + verificação de identidade + verificação de aparelho Android
      ↓
Criar o app no Console + preencher "Conteúdo do app" (políticas)
      ↓
Teste interno (até 100 testadores, liberado em minutos/horas)   <- já serve para o TCC
      ↓
Teste FECHADO: mínimo de 12 testadores inscritos por 14 dias SEGUIDOS
      ↓
Solicitar acesso à produção (questionário sobre o teste; análise pela Google)
      ↓
Produção (revisão do app, com Health Connect e declaração de saúde)
```

| Etapa | Tempo típico |
|---|---|
| Criação da conta + verificação de identidade | 1 a 7 dias (pode pedir reenvio de documento) |
| Preparar keystore, AAB, textos, imagens, formulários | 2 a 5 dias de trabalho seu |
| Teste interno | mesmo dia |
| Teste fechado | **no mínimo 14 dias** depois que o 12º testador entrar. Na prática, 3 semanas |
| Análise do pedido de acesso à produção | cerca de 7 dias (varia) |
| Revisão de produção (app de saúde + Health Connect) | alguns dias a 2 semanas; pode haver rejeição e reenvio |
| **Total realista** | **5 a 8 semanas** |

Detalhe importante do teste fechado: só contam testadores que ficaram **continuamente** inscritos por 14 dias. Quem sai antes não conta, e quem sai e volta reinicia a contagem. Recrute 15 a 20 pessoas para ter folga.

**Recomendação para o TCC:** se a banca estiver perto, faça só até o **teste interno**. É distribuição oficial pela Play, instala pelo link da loja, resolve o problema da verificação de desenvolvedor e não depende dos 14 dias. A produção pública pode vir depois.

Fonte: [Requisitos de teste para novas contas pessoais](https://support.google.com/googleplay/android-developer/answer/14151465)

---

## 2. Pré-requisitos e custos

| Item | Custo | Observação |
|---|---|---|
| Conta Google Play Console | **US$ 25, uma vez só** | Cartão de crédito/débito internacional (Visa, Master, Amex). **Cartão pré-pago não é aceito.** Se a identidade for recusada, a taxa **não** é devolvida. |
| Documento oficial com foto + cartão no **mesmo nome legal** | grátis | Exigido na verificação de identidade da conta pessoal. |
| Celular Android físico com o app **Play Console** instalado | grátis | Contas pessoais novas precisam comprovar acesso a um aparelho Android real (o S25+ serve). |
| JDK (`keytool`) | grátis | Já vem com o Android Studio (`C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe`). |
| Hospedagem da política de privacidade | grátis | GitHub Pages (seção 5.4). |
| Build | grátis | Build local com `gradlew` (recomendado). EAS Build tem plano gratuito com fila e limite mensal, útil só como alternativa se o build local quebrar. |
| E-mail de contato do desenvolvedor | grátis | Fica público na loja. Hoje as políticas usam `apsicare.noreply@gmail.com`. Um endereço "noreply" passa a impressão de que ninguém lê; o ideal é criar algo como `apsicare.contato@gmail.com` e usar o mesmo em todos os lugares. |

**Conta pessoal ou de organização?** Conta de organização exige número D-U-N-S (empresa). O ApsiCare não tem CNPJ, então o caminho é a **conta pessoal**. Veja o risco na seção 6.3: a Google exige conta de organização para "Medical apps".

Fonte: [Registro da conta](https://support.google.com/googleplay/android-developer/answer/6112435) · [Requisitos da Play Console](https://support.google.com/googleplay/android-developer/answer/10788890)

---

## 3. Preparação do projeto

### 3.0 Target SDK: já atende

- Exigência atual: **desde 31/08/2026, apps novos e atualizações precisam ter `targetSdk` 36 (Android 16) ou maior.** Existe extensão até 01/11/2026 só para quem pedir.
- O projeto usa `targetSdkVersion rootProject.ext.targetSdkVersion`, que vem do React Native 0.81.5: `node_modules/react-native/gradle/libs.versions.toml` declara `targetSdk = "36"` e `compileSdk = "36"`. **Atende.**
- Como conferir no AAB final: Play Console > app > "Explorador de pacotes de apps" mostra o target. Localmente, rode `./gradlew :app:dependencies` ou veja `android/app/build/intermediates/merged_manifest/release/.../AndroidManifest.xml`.
- Páginas de memória de 16 KB (exigido para apps com target Android 15+): RN 0.81 e Expo 54 já vêm compatíveis. A Play Console avisa no upload se alguma lib nativa não for.

Fonte: [Target API level requirements](https://developer.android.com/google/play/requirements/target-sdk) · [16 KB page sizes](https://developer.android.com/guide/practices/page-sizes)

### 3.1 Gerar a keystore de upload

Com **Play App Signing**, que é obrigatório para apps novos, a Google guarda a chave que assina o app entregue aos usuários. Você só assina o upload com a sua **chave de upload**. Se perder a chave de upload, dá para pedir reset pela Play Console. Mesmo assim, faça backup.

No PowerShell (fora do repositório, em uma pasta só sua):

```powershell
mkdir C:\Users\verin\keys
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkeypair -v `
  -keystore C:\Users\verin\keys\apsicare-upload.jks `
  -alias apsicare-upload -keyalg RSA -keysize 2048 -validity 10000
```

- O comando pede uma senha e dados de nome/organização. Pode colocar seu nome e "ApsiCare".
- **Backup:** copie `apsicare-upload.jks` e as senhas para um lugar seguro (pendrive + gerenciador de senhas / Google Drive pessoal). **Nunca** coloque no Git.
- A raiz `.gitignore` não ignora `*.jks`/`*.keystore`. Mantendo o arquivo fora do repo, o problema some.

### 3.2 Senhas fora do repositório

Crie ou edite `C:\Users\verin\.gradle\gradle.properties`. Esse é o gradle.properties **do usuário**: não fica no projeto e sobrevive a `expo prebuild`.

```properties
APSICARE_UPLOAD_STORE_FILE=C:/Users/verin/keys/apsicare-upload.jks
APSICARE_UPLOAD_KEY_ALIAS=apsicare-upload
APSICARE_UPLOAD_STORE_PASSWORD=sua_senha_aqui
APSICARE_UPLOAD_KEY_PASSWORD=sua_senha_aqui
```

Use barras `/` no caminho, mesmo no Windows. **Não** coloque isso em `android/gradle.properties`, que é versionado.

### 3.3 `signingConfigs` de release

Hoje `android/app/build.gradle` tem `release { signingConfig signingConfigs.debug }`. Essa build não é aceita para distribuição séria e cairia no problema da seção 0. A mudança fica assim:

```gradle
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('APSICARE_UPLOAD_STORE_FILE')) {
                storeFile file(APSICARE_UPLOAD_STORE_FILE)
                storePassword APSICARE_UPLOAD_STORE_PASSWORD
                keyAlias APSICARE_UPLOAD_KEY_ALIAS
                keyPassword APSICARE_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        ...
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
```

### 3.4 Problema: `expo prebuild` sobrescreve `android/`

`npx expo prebuild`, que já é necessário quando você mexe em `app.json` (ex.: push/FCM), **regera `android/app/build.gradle`** e apaga a edição acima. Duas saídas:

**Opção A (recomendada): config plugin**, igual ao que já existe em `plugins/withHealthConnectMainActivity.js`. Crie `plugins/withReleaseSigning.js`:

```js
const { withAppBuildGradle } = require('@expo/config-plugins');

const RELEASE_SIGNING = `
        release {
            if (project.hasProperty('APSICARE_UPLOAD_STORE_FILE')) {
                storeFile file(APSICARE_UPLOAD_STORE_FILE)
                storePassword APSICARE_UPLOAD_STORE_PASSWORD
                keyAlias APSICARE_UPLOAD_KEY_ALIAS
                keyPassword APSICARE_UPLOAD_KEY_PASSWORD
            }
        }`;

module.exports = (config) =>
  withAppBuildGradle(config, (config) => {
    let g = config.modResults.contents;
    if (!g.includes('APSICARE_UPLOAD_STORE_FILE')) {
      g = g.replace(
        /(signingConfigs\s*\{\s*debug\s*\{[^}]*\})/,
        `$1${RELEASE_SIGNING}`
      );
      g = g.replace(
        /(release\s*\{[^}]*?)signingConfig signingConfigs\.debug/,
        '$1signingConfig signingConfigs.release'
      );
    }
    config.modResults.contents = g;
    return config;
  });
```

Depois adicione `"./plugins/withReleaseSigning"` à lista `plugins` do `app.json`, rode `npx expo prebuild --platform android` e confira se `android/app/build.gradle` ficou certo.

**Opção B (manual):** edite o `build.gradle` à mão e **reaplique toda vez** depois de um `prebuild`. Funciona, mas é fácil esquecer. Se esquecer, o sintoma é o AAB ser recusado na Play Console por estar assinado com a chave debug.

### 3.5 versionCode / versionName

- Hoje: `versionCode 1` e `versionName "1.0.0"` no `build.gradle`. O `app.json` **não** define `version` nem `android.versionCode`, então cada `prebuild` volta para 1 / 1.0.0.
- A Play **recusa** um upload com `versionCode` igual ou menor que um já enviado, em qualquer faixa, inclusive teste interno.
- Defina no `app.json` (fonte da verdade que sobrevive ao prebuild):

```json
"expo": {
  "version": "1.0.0",
  "android": {
    "versionCode": 1,
    ...
  }
}
```

  A cada novo upload: `versionCode` +1 (2, 3, 4...). `version` muda quando você quiser (1.0.1, 1.1.0...). Rode `prebuild` de novo ou atualize o `build.gradle` junto.
- O texto fixo `Versão 1.0.0` em `src/screens/Configs/configuracoes.js` pode ser trocado por `Constants.expoConfig.version` (`expo-constants` já está instalado) para não ficar desatualizado.
- Observação: o `eas.json` usa `appVersionSource: "remote"`, que só vale para builds EAS. No build local, quem manda é o `app.json`/`build.gradle`.

### 3.6 Gerar o AAB

A Play Store só aceita **Android App Bundle (.aab)** para apps novos. APK não é aceito.

```powershell
cd C:\Users\verin\Documents\GitHub\PsicoCare\android
.\gradlew clean
.\gradlew bundleRelease
```

Saída: `android\app\build\outputs\bundle\release\app-release.aab`

Para conferir que foi assinado com a chave de upload, e não com a debug:

```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -printcert -jarfile android\app\build\outputs\bundle\release\app-release.aab
```

O "Owner" precisa ser o que você digitou no `keytool`, e não `CN=Android Debug`.

Para continuar testando localmente com APK: `.\gradlew assembleRelease` passa a sair assinado com a chave de upload também. Um APK assim **não** substitui por cima um APK debug já instalado (assinaturas diferentes); desinstale o antigo primeiro.

**Alternativa EAS (gratuita, com limite):** `eas build -p android --profile production` gera o AAB na nuvem e pode gerenciar a keystore por você. O plano grátis tem fila e cota mensal. Só vale se o build local der problema.

Fontes: [Expo — builds de produção locais](https://docs.expo.dev/guides/local-app-production/) · [Android App Bundle](https://developer.android.com/guide/app-bundle) · [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)

---

## 4. Criar a conta e o app na Play Console

1. Acesse https://play.google.com/console e entre com a conta Google que vai ser a "dona" do app. Prefira uma conta pessoal sua, e não uma de colega do grupo: o repositório está em `bleer2004/ApsiCare`, mas quem publica é quem mantém.
2. Escolha **"Para você mesmo" (conta pessoal)**, pague os US$ 25 e preencha o nome legal, endereço e telefone.
3. Faça a **verificação de identidade** (documento com foto + cartão no mesmo nome).
4. Instale o app **Google Play Console** no seu Android e conclua a **verificação de acesso a aparelho**.
5. **Criar app:**
   - Nome: `ApsiCare` (até 30 caracteres). Decida entre `Apsicare` e `ApsiCare`. O `app.json` usa `"name": "Apsicare"` e os documentos usam "ApsiCare". Padronize, porque o nome da loja e o nome sob o ícone devem bater.
   - Idioma padrão: Português (Brasil).
   - App ou jogo: **App**. Gratuito ou pago: **Gratuito** (não dá para mudar para pago depois).
   - Aceite as declarações.
6. O **package** (`com.vewadie.apsicare`) é definido no primeiro AAB enviado e **não muda nunca mais**.
7. Em **Configuração > Integridade do app > Assinatura de apps**, confirme que o **Play App Signing** está ativo (padrão). No primeiro upload, a chave de upload é registrada.

---

## 5. Página da loja (Presença na loja > Página principal)

### 5.1 Textos

- **Nome do app** (até 30): `ApsiCare`
- **Descrição curta** (até 80), sugestão:
  `Acompanhamento entre psicólogo e paciente: diário, humor e frequência cardíaca.`
- **Descrição completa** (até 4000). Precisa incluir:
  - o que o app faz para cada perfil (paciente e psicólogo);
  - que o paciente entra por **convite** de um psicólogo cadastrado;
  - o uso do Health Connect (somente frequência cardíaca, somente leitura);
  - que o diário (texto/voz) é analisado por IA de terceiros;
  - o **aviso exigido pela política de saúde** (texto obrigatório, adaptado):
    > "O ApsiCare não é um dispositivo médico e não diagnostica, trata, cura ou previne nenhuma condição de saúde. Os insights gerados são estimativas automatizadas e não substituem a avaliação de um profissional. Consulte sempre um profissional de saúde para aconselhamento, diagnóstico ou tratamento."
  - o aviso de emergência, que já está nos Termos: "Não é um serviço de emergência. Em caso de crise, ligue para o CVV (188) ou SAMU (192)."
  - que é um projeto acadêmico (TCC). Isso ajuda a revisão a entender o contexto.
- **Evite** frases como "detecta ansiedade", "diagnóstico de estresse" ou "trata depressão". Alegações médicas levam o app para a categoria "Medical" (ver 6.3). Prefira "acompanhamento", "bem-estar", "estimativa de estresse".
- **Categoria**: "Saúde e fitness" ou "Medicina". Recomendo **Saúde e fitness**, pelo mesmo motivo da seção 6.3.
- **E-mail de contato**: obrigatório e público.
- **URL da política de privacidade**: obrigatória (5.4).

### 5.2 Imagens

| Recurso | Especificação |
|---|---|
| Ícone da loja | **512 x 512 px**, PNG 32 bits, até 1 MB, sem cantos arredondados (a Play arredonda) |
| Gráfico de recurso (feature graphic) | **1024 x 500 px**, PNG ou JPG, sem transparência |
| Capturas de tela de celular | **mínimo 2** (recomendado 4 a 8), PNG/JPG, lado menor entre 320 e 3840 px, proporção até 2:1. Tirar no S25+ serve. |

Sugestões de screenshots: login, home do paciente, Diário com humor, "Meus dados" com o smartwatch conectado, visão geral do psicólogo, perfil/relatório do paciente. **Use dados fictícios** (contas demo WESAD), nunca dados de pessoas reais.

Ícone dentro do app: ver a lacuna 8.6 (o `app.json` não define ícone).

### 5.3 Ficha de detalhes do app

Em "Configurações da loja": categoria, tags, e-mail e (opcional) site/telefone.

### 5.4 Hospedar a política de privacidade de graça (GitHub Pages)

A política precisa estar numa **URL pública, acessível sem login, que não seja PDF para download nem página editável**. Ela também deve ser **a mesma** exibida pelo link da política dentro do Health Connect e dentro do app.

Passo a passo:

1. Crie um repositório **público** na sua conta, ex.: `verinawadie/apsicare-legal`. Se o repo principal (`bleer2004/ApsiCare`) for privado, o GitHub Pages dele só funciona em plano pago. Um repo separado só com os textos legais evita isso e não expõe o código.
2. Copie `docs/politica-de-privacidade.md` para `index.md` e `docs/termos-de-uso.md` para `termos.md`. Crie também `excluir-conta.md` (ver 6.7).
3. **Settings > Pages > Deploy from a branch > main / root.** Em poucos minutos a página fica em `https://<seu-usuario>.github.io/apsicare-legal/`.
4. Os links relativos entre os documentos (`./termos-de-uso.md`) precisam ser ajustados para os novos nomes.
5. Use essa URL em: página da loja, Data Safety, declaração do Health Connect e, idealmente, também dentro do app (a tela `DocumentoLegal` já mostra o texto embutido em `src/content/legalDocs.js`; mantenha os dois sincronizados).

Alternativa sem GitHub: Google Sites (grátis). Notion público também funciona, mas às vezes é bloqueado por revisores por exigir JavaScript.

---

## 6. Formulários de política (Política > Conteúdo do app)

Preencha **todos** antes do primeiro envio. A Play bloqueia o lançamento em qualquer faixa, inclusive teste interno, se houver pendência.

### 6.1 Acesso ao app (App access)

O app exige login e o paciente só existe por convite, então **o revisor não consegue entrar sozinho**. Marque "Todas ou algumas funcionalidades são restritas" e forneça:

- 1 conta de **psicólogo** demo (e-mail + senha);
- 1 conta de **paciente** demo vinculada a ele, com dados (as contas demo WESAD servem);
- instruções curtas: "Entre como paciente > Diário para registrar humor; Meus dados > Conectar Smartwatch (precisa do Health Connect; se o aparelho de teste não tiver relógio, mostra aviso de ausência de medições)".

Sem isso, a rejeição é quase certa.

### 6.2 Anúncios

**Não, o app não contém anúncios.** Não há SDK de anúncios no `package.json`.

### 6.3 Declaração de apps de saúde (Health apps declaration)

**Obrigatória para todo app publicado**, inclusive em teste fechado/aberto.

Categorias do formulário e o que marcar para o ApsiCare:

| Opção | Definição da Google | Marcar? |
|---|---|---|
| **Health and fitness > Stress management, relaxation, mental acuity** | "Apps offering guidance on stress management, mindfulness, meditation..." | **Sim**: estimativa de estresse, exercício de respiração no Diário |
| Health and fitness > Activity and fitness | atividade física | Não (passos/calorias foram removidos) |
| **Medical > Mental and behavioral health** | "Tools for mental health support, counseling services..." | **Ponto de atenção**, ver abaixo |
| Medical > Healthcare services and management | agendamento, telessaúde, prontuário | Provavelmente sim, por honestidade: o psicólogo acompanha o paciente, guarda diagnóstico/observações e documentos |
| Human subjects research | pesquisa com aprovação de comitê de ética (IRB) | Só se o TCC for uma pesquisa formal com participantes reais. Nesse caso é preciso comprovar aprovação do comitê de ética. |

**Risco real:** a página de requisitos da Play Console diz que *"Health apps, such as Medical apps and Human Subjects Research apps"* **precisam ser publicados por conta de organização**. Um app que conecta psicólogo e paciente, com diagnóstico e observações clínicas, pode ser enquadrado como "Medical" pela revisão, e aí a conta pessoal não serve (conta de organização exige D-U-N-S/CNPJ).

Como reduzir o risco, sem mentir no formulário, o que causaria suspensão:
- Posicionar o produto como **ferramenta de bem-estar e acompanhamento**, não como ferramenta clínica/diagnóstica, na descrição, nos screenshots e nas telas.
- Manter o aviso "não é dispositivo médico" na loja e dentro do app.
- Se a Google exigir conta de organização, as alternativas são publicar pela instituição de ensino (universidades costumam ter conta/D-U-N-S), ou manter só no **teste interno/fechado** para o TCC, ou usar a conta de distribuição limitada (seção 0).

Fontes: [Health Content and Services](https://support.google.com/googleplay/android-developer/answer/16679511) · [Formulário Health apps declaration](https://support.google.com/googleplay/android-developer/answer/14738291) · [Requisitos da Play Console (conta de organização)](https://support.google.com/googleplay/android-developer/answer/10788890)

### 6.4 Declaração de permissões do Health Connect

Fica em **Conteúdo do app > Health Connect / Permissões de saúde**. É obrigatória porque o manifest pede `android.permission.health.READ_HEART_RATE`.

- **Funcionalidade:** selecione "Stress management, relaxation, mental acuity" e, se aplicável, "Mental and behavioral health" (mantenha coerente com a 6.3).
- **Tipo de dado:** somente **Heart rate (leitura)**. Não peça nada além disso. A política diz: *"If your app does not require access to specific data types, you must not request access to them."* O `app.json` já está enxuto nesse ponto.
- **Justificativa** (em inglês costuma ir mais rápido; sugestão):
  > "ApsiCare reads the user's heart rate records (last 24 hours) from Health Connect, only after explicit user action on the 'My data' screen. Heart rate is used to estimate a daily physiological stress indicator (HR and HRV-derived metrics), which is shown to the user and to the psychologist the user is linked to, supporting ongoing psychological follow-up. Data is transmitted over HTTPS to our backend (AWS, Brazil) and is never sold, used for advertising, or shared with third parties. Users can delete their account and data at any time."
- **Política de privacidade:** a mesma URL da loja. Ela **precisa** citar o Health Connect nominalmente, quais dados são lidos, para quê, com quem são compartilhados, retenção e exclusão. A atual cita isso na seção 2.2, mas veja a lacuna 8.4.
- **Tela de justificativa (rationale):** quando o usuário toca em "política de privacidade" do app dentro do Health Connect, o Android abre a activity registrada para `ACTION_SHOW_PERMISSIONS_RATIONALE` / `VIEW_PERMISSION_USAGE`. Hoje essa activity é a `MainActivity`, que abre o app normal e não mostra a política. Ver lacuna 8.5.
- A declaração é revista a cada nova versão enviada. Se aprovada e depois você acrescentar outro tipo de dado, precisa declarar de novo.
- **Não enviar dados do Health Connect para a IA/LLM.** Hoje só o texto do diário vai para OpenRouter; a frequência cardíaca fica na AWS. Mantenha assim.

Fontes: [Declarar acesso ao Health Connect](https://developer.android.com/health-and-fitness/guides/health-connect/publish/declare-access) · [Android Health Permissions: Guidance and FAQs](https://support.google.com/googleplay/android-developer/answer/12991134)

### 6.5 Segurança dos dados (Data Safety), preenchido para este app

Perguntas gerais:

| Pergunta | Resposta |
|---|---|
| O app coleta ou compartilha algum dos tipos de dados exigidos? | **Sim** |
| Todos os dados são criptografados em trânsito? | **Sim**: API Gateway em HTTPS, Groq/OpenRouter/Expo em HTTPS |
| Os usuários podem pedir a exclusão dos dados? | **Sim**, **depois** de implementar a exclusão (lacuna 8.1). Informe a URL de exclusão (6.7). |
| Declaração de conformidade com a política de Famílias | Não se aplica (não é para crianças) |

"Coletado" = sai do aparelho para você ou para um terceiro. "Compartilhado" = vai para um **terceiro** que não é seu prestador de serviço. Provedores que processam **em seu nome e sob suas instruções** (AWS, OpenRouter, Groq, Expo/FCM) contam como **prestadores de serviço** e **não** entram como "compartilhado". Continuam entrando como "coletado". Dados que só passam pela memória para atender uma requisição podem ser declarados como "processados de forma temporária".

| Categoria > tipo | Coletado | Compartilhado | Opcional? | Finalidades a marcar | De onde vem no ApsiCare |
|---|---|---|---|---|---|
| **Informações pessoais > Nome** | Sim | Não | Obrigatório | Funcionalidade do app, Gerenciamento da conta | cadastro de paciente/psicólogo |
| **Informações pessoais > Endereço de e-mail** | Sim | Não | Obrigatório | Funcionalidade do app, Gerenciamento da conta, Comunicações do desenvolvedor (recuperação de senha por e-mail) | login, `forgot-password` |
| **Informações pessoais > Número de telefone** | Sim | Não | Opcional (confira se o cadastro obriga) | Funcionalidade do app | perfil |
| **Informações pessoais > Outras informações** | Sim | Não | Opcional | Funcionalidade do app | data de nascimento, contato de emergência (`salvar-contato-emergencia`) |
| **Saúde e fitness > Informações de saúde** | Sim | Não | Opcional | Funcionalidade do app, **Personalização** (insights) | humor, diário, diagnóstico/observações do psicólogo, insights de estresse |
| **Saúde e fitness > Informações de condicionamento físico** | Sim | Não | Opcional | Funcionalidade do app | frequência cardíaca do Health Connect (`HEALTH_BATCH#`) |
| **Arquivos de áudio > Gravações de voz ou som** | Sim, **processado temporariamente**, se o áudio não for guardado | Não (Groq como prestador) | Opcional | Funcionalidade do app | gravação do Diário enviada ao Groq |
| **Atividade no app > Outro conteúdo gerado pelo usuário** | Sim | Não | Opcional | Funcionalidade do app | texto do diário |
| **Arquivos e documentos** | Sim | Não | Opcional | Funcionalidade do app | `upload-documento` (S3) |
| **IDs do dispositivo ou outros IDs** | Sim | Não | Obrigatório (quando aceita notificações) | Funcionalidade do app (notificações) | token push Expo/FCM (`registrar-push-token`) |
| **Informações do app e desempenho** (falhas, diagnósticos) | Não | — | — | — | não há Sentry/Crashlytics |
| Localização, contatos, fotos, mensagens, financeiro, histórico de navegação | Não | — | — | — | — |

Não marque "Publicidade ou marketing" nem "Análise" em nada. Não há SDK de anúncios/analytics.

Atenção: `react-native-image-picker` e `expo-document-picker` estão no `package.json`. Se alguma tela envia **foto** (ex.: foto de perfil), marque também **Fotos e vídeos > Fotos**. Confira antes de enviar.

Coerência: a Google compara o Data Safety com a política de privacidade e com o comportamento real do APK. Qualquer divergência (ex.: política dizendo HuggingFace e app chamando Groq) é motivo de rejeição (lacuna 8.3).

Fonte: [Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469)

### 6.6 Classificação de conteúdo (questionário IARC)

- Categoria: **"Todos os outros tipos de apps"** (não é jogo nem rede social).
- Violência, sexo, linguagem, drogas, apostas: **Não**.
- "Os usuários podem interagir ou trocar conteúdo?": **Sim**. O paciente compartilha anotações do diário com o psicólogo. Só entre usuários vinculados, sem chat público.
- "Compartilha a localização do usuário com outros?": Não.
- Resultado esperado: Livre / L (ou 12 dependendo do tema). Temas de saúde mental não elevam a classificação por si só.

Fonte: [Classificação de conteúdo](https://support.google.com/googleplay/android-developer/answer/9898843)

### 6.7 Exclusão de conta (obrigatório)

A regra vale para todo app que **permite criar conta dentro do app**. Isso inclui o psicólogo (`cadastro.js`) e o paciente, que cria senha pelo convite. Exige **as duas coisas**:

1. **Caminho dentro do app** para excluir a conta **e os dados associados**, fácil de achar (ex.: Configurações/Perfil). Não basta "mande e-mail".
2. **Link na web** (informado no Data Safety) onde o usuário pede a exclusão **sem precisar reinstalar o app**. Pode ser uma página no mesmo GitHub Pages (`excluir-conta.md`) explicando os passos no app e oferecendo o e-mail de contato com um modelo de pedido ("Assunto: Excluir conta ApsiCare; informe o e-mail cadastrado"). A página deve citar o nome do app/desenvolvedor, dizer quais dados são apagados, quais ficam retidos (se algum) e por quanto tempo.

Tudo que aparece no Data Safety precisa ser apagado: perfil, `MOOD#`, `HEALTH_BATCH#`, `PHYSIO#`, `INSIGHT#`, documentos no S3, item "link" `CLINICIAN#<id>/PATIENT#<id>` e token push. Para o psicólogo: `CLINICIAN#` e `NOTIFICATION#`. Decida e documente o que acontece com os pacientes de um psicólogo que se exclui.

Hoje **não existe** implementação. Ver lacuna 8.1.

Fonte: [Requisitos de exclusão de conta](https://support.google.com/googleplay/android-developer/answer/13327111)

### 6.8 Público-alvo e conteúdo

- Faixa etária: marque **18 anos ou mais** (ou 16+ no mínimo). Se marcar qualquer faixa abaixo de 13, entram as regras da política de Famílias, muito mais rígidas (sem Health Connect para crianças, exigências de COPPA etc.).
- Os Termos atuais dizem que menores podem usar com supervisão do responsável. Para simplificar a publicação, recomendo ajustar para **18+** (ou manter e marcar 13+ sem público infantil, sabendo que a revisão pode questionar).
- "O app pode atrair crianças involuntariamente?": Não.

Fonte: [Público-alvo e conteúdo](https://support.google.com/googleplay/android-developer/answer/9867159)

### 6.9 Outras declarações do "Conteúdo do app"

- **Política de privacidade**: URL da 5.4.
- **App de notícias**: Não. **App governamental**: Não. **Recursos financeiros**: Nenhum.
- **ID de publicidade**: o app **não** usa (nenhuma lib de anúncio/analytics). Responda "Não". Se a Play Console acusar a permissão `com.google.android.gms.permission.AD_ID` no manifest mesclado (algumas libs do Firebase a adicionam), bloqueie a permissão (lacuna 8.7) ou declare o uso real.
- **Permissão de microfone (`RECORD_AUDIO`)**: não tem formulário próprio, mas exige **divulgação em destaque antes do pedido de permissão** (o modal de consentimento LGPD do `DiarioPaciente.js` cumpre isso, desde que cite o provedor correto) e declaração no Data Safety (áudio). Grave só enquanto o usuário segura/aciona o botão, como já faz, e nunca em segundo plano.
- **Notificações (`POST_NOTIFICATIONS`)**: sem formulário. Só pedir a permissão em tempo de execução, como já é feito.

Fonte: [Permissões e APIs que acessam informações sensíveis](https://support.google.com/googleplay/android-developer/answer/16585319) · [Política de dados do usuário](https://support.google.com/googleplay/android-developer/answer/10144311)

---

## 7. Teste interno → teste fechado → produção

### 7.1 Teste interno (use para a banca do TCC)

1. **Testar e lançar > Testes > Teste interno > Criar nova versão.**
2. Envie o `app-release.aab`. Nas notas da versão escreva, por exemplo, "Primeira versão de teste".
3. **Testadores:** crie uma lista de e-mails (até 100 contas Google) e copie o **link de participação**.
4. Cada testador abre o link, aceita e instala pela Play Store. Normalmente fica disponível em minutos.
5. **Integridade do app > Assinatura de apps:** copie o **SHA-1 da chave de assinatura do app** (a da Google, não a sua de upload). Se algum serviço restringir chave por SHA-1 (ex.: a chave de API do Firebase / `google-services.json`, restrita por package+SHA), adicione esse SHA-1 no Firebase Console. Senão, o push pode parar de funcionar nas instalações vindas da Play.
6. Teste de verdade no aparelho: login dos dois perfis, Health Connect (conectar, sincronizar, negar permissão), gravação de voz, push para o psicólogo.

### 7.2 Teste fechado (obrigatório antes da produção)

- **Testes > Teste fechado > Criar faixa** (ou usar a "Alpha"), enviar o mesmo AAB ou um mais novo e adicionar os testadores por lista de e-mails ou Grupo do Google.
- **Regra:** no mínimo **12 testadores inscritos continuamente por 14 dias**. Quem sai antes dos 14 dias não conta.
- **Como recrutar de graça:**
  - colegas de turma, grupo do TCC, família, orientador;
  - crie um **Grupo do Google** (ex.: `apsicare-testers@googlegroups.com`) e adicione o grupo como testador. Fica mais fácil incluir gente e ninguém precisa mandar o e-mail para você;
  - comunidades de "troca de testes" (subreddits como r/AndroidClosedTesting, grupos de Telegram/Discord de devs) funcionam, mas o testador precisa **realmente abrir o app**. A Google pergunta no pedido de produção como foi o engajamento, e testadores "fantasmas" levam a pedido negado;
  - peça para cada um **instalar, abrir o app várias vezes nos 14 dias** e mandar feedback, que pode ser pelo próprio "Enviar feedback privado" da Play.
- Como o app exige conta, crie contas demo de paciente para os testadores (ou convites) antes. Sem login ninguém consegue usar, e o engajamento aparece zerado.
- Suba **pelo menos 1 atualização** durante o teste (versionCode +1) corrigindo o que os testadores relatarem. Isso conta a favor no questionário.

### 7.3 Solicitar acesso à produção

Depois dos 14 dias, o botão **"Solicitar acesso à produção"** aparece no Painel. O questionário pergunta:
- como você recrutou os testadores e como foi o engajamento;
- que feedback recebeu e o que mudou;
- se o app está pronto para produção e qual o público esperado.

Responda com detalhes e honestidade (ex.: "projeto de TCC, 15 testadores entre colegas e familiares, corrigimos X e Y"). A análise leva até cerca de 7 dias. Se negar, a Google diz o motivo e você pode fazer mais teste fechado e pedir de novo.

### 7.4 Produção

1. **Produção > Criar nova versão**, envie o AAB e escolha os países (pode ser só o Brasil).
2. **Lançamento gradual** (ex.: 20%) é opcional.
3. **Enviar para revisão.** Apps com Health Connect e declaração de saúde passam por revisão mais demorada. Se rejeitado, a Play Console mostra a política violada. Corrija, suba versionCode +1 e reenvie.

---

## 8. Lacunas encontradas no projeto que podem bloquear a aprovação

Ordenadas por gravidade.

### 8.1 BLOQUEADOR: não existe exclusão de conta

- `src/screens/Configs/configuracoes.js` (linha ~607): o botão **"Excluir conta"** é um `TouchableOpacity` **sem `onPress`**. Não faz nada.
- Lado do paciente (`paciente/src/screens/perfilPaciente.js`): não há opção de excluir conta.
- Backend: não existe lambda de exclusão em `lambdas/` (há `deletar-documento` e `deletar-goal`, mas nada para conta).
- A política de privacidade (seção 13) e os Termos (12.1) dizem que a exclusão é por e-mail. A Play exige **caminho dentro do app + link web**.
- O que falta: lambda `DELETE /patients/{id}` e `DELETE /clinicians/{id}` que apaguem todos os itens `PK = PATIENT#<id>` (Query + BatchWrite), o item link `CLINICIAN#.../PATIENT#<id>`, os objetos S3 em `patients/<id>/documents/`, e a tela com confirmação no app. Mais a página web de exclusão (6.7).

### 8.2 BLOQUEADOR: sem URL pública da política de privacidade

- A política existe só em `docs/politica-de-privacidade.md` e embutida no app (`src/content/legalDocs.js`). Não há URL pública. Ver 5.4.

### 8.3 BLOQUEADOR (coerência): política diz HuggingFace, app usa Groq

- `paciente/src/screens/DiarioPaciente.js` (linha ~171) envia o áudio **direto do celular** para `https://api.groq.com/openai/v1/audio/transcriptions`.
- `docs/politica-de-privacidade.md` (seção 5), `docs/termos-de-uso.md` (4.2) e `src/content/legalDocs.js` (linhas 37, 123, 128) dizem **HuggingFace (Whisper)**. O `CLAUDE.md` também cita um lambda `transcrever-voz` que não existe em `lambdas/`.
- Corrija os três textos para **Groq** (e o consentimento do diário, se citar outro nome). A Google compara política, Data Safety e tráfego real.
- **Segurança:** `src/services/api.ts` define `GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY`. Variáveis `EXPO_PUBLIC_*` são **embutidas no bundle JavaScript do AAB** e qualquer pessoa extrai a chave de um app público na loja. Não é bloqueio formal da revisão, mas uma chave vazada gera abuso/custo. O ideal é mover a transcrição para um lambda, como já é feito com o OpenRouter em `analisar-texto`, e revogar a chave atual no painel da Groq.

### 8.4 Política de privacidade incompleta para Health Connect / Data Safety

Pontos que a política atual não cobre e que a Play/Health Connect cobram:
- **"Health Connect"** e o tipo de dado (**somente leitura de frequência cardíaca**) estão na 2.2, mas falta dizer explicitamente que os dados do Health Connect **não são usados para publicidade, não são vendidos e não são enviados aos provedores de IA**.
- **Armazenamento de documentos no Amazon S3** (`lambdas/upload-documento`) não aparece na tabela da seção 5.
- **Contato de emergência** (dado de terceiro, `salvar-contato-emergencia`) não aparece na seção 2.
- **Recuperação de senha por e-mail** (há `@aws-sdk/client-ses` no `package.json`): cite o Amazon SES como prestador.
- A seção 2.2 fala em "intervalos entre batimentos lidos do smartwatch", mas o IBI é **aproximado a partir do BPM**. Ajuste para não prometer um dado que não é lido.
- Prazo concreto de exclusão (ex.: "até 30 dias") em vez de "prazo razoável".
- Identificação do responsável: a política diz "equipe de desenvolvimento". Na loja, o desenvolvedor será a pessoa da conta pessoal. Cite o nome do desenvolvedor/responsável como aparece na Play.

### 8.5 Health Connect: o link "política de privacidade" do Health Connect não mostra a política

- `plugins/withHealthConnectMainActivity.js` e o `AndroidManifest.xml` apontam `VIEW_PERMISSION_USAGE` e `ACTION_SHOW_PERMISSIONS_RATIONALE` para a **`MainActivity`**. Ela abre o app normal (tela de login), não a política.
- A exigência é que esse link exiba a política de privacidade, a mesma da loja. Solução comum: uma activity nativa simples (ou um intent tratado na `MainActivity`) que abra a URL pública da política no navegador, ou rotear para a tela `DocumentoLegal` com `tipo: 'privacidade'`. Pode ser feito no mesmo config plugin.
- Menor: o `<intent-filter>` de `ACTION_SHOW_PERMISSIONS_RATIONALE` aparece **3 vezes** no manifest (bug conhecido do plugin `react-native-health-connect`, já descrito no CLAUDE.md). Não bloqueia.

### 8.6 Ícone e splash: não configurados

- `app.json` **não tem** `icon`, `android.adaptiveIcon` nem `splash`. Não existe pasta `assets/` na raiz. Os `mipmap-*/ic_launcher.webp` em `android/app/src/main/res` são os gerados por padrão no prebuild, provavelmente o ícone genérico do Expo.
- Um ícone genérico/placeholder pode ser motivo de rejeição por "metadados enganosos/baixa qualidade" e fica diferente do ícone 512 da loja.
- Crie `assets/icon.png` (1024x1024), `assets/adaptive-icon.png` (foreground 1024x1024 com margem) e a splash. Configure em `app.json` (`icon`, `android.adaptiveIcon.foregroundImage` + `backgroundColor`, plugin `expo-splash-screen` ou `splash`) e rode `prebuild`.

### 8.7 Permissões declaradas que o app não usa

O `AndroidManifest.xml` mesclado tem, além das três do `app.json`:
- `SYSTEM_ALERT_WINDOW`: "desenhar sobre outros apps". Não é usada pelo app, vem do template/dev-client. É permissão especial e chama atenção na revisão.
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`: não fazem sentido com target 36 (seletores de arquivo não precisam delas) e a Play pede justificativa para acesso amplo a armazenamento.
- `MODIFY_AUDIO_SETTINGS`, `VIBRATE`, `INTERNET`: inofensivas, pode manter.

Remova as desnecessárias pelo `app.json`, porque editar o manifest à mão se perde no prebuild:

```json
"android": {
  "blockedPermissions": [
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
    "com.google.android.gms.permission.AD_ID"
  ]
}
```

Antes de bloquear o armazenamento, confirme que o upload de documentos (`expo-document-picker`) e o `react-native-image-picker` continuam funcionando. Com target 36 eles usam o seletor do sistema e não precisam dessas permissões.

### 8.8 Assinatura release com a keystore debug

- `android/app/build.gradle`: `release { signingConfig signingConfigs.debug }`. Ver 3.1 a 3.4. Essa build não é aceita e também sofre com a verificação de desenvolvedor (seção 0).

### 8.9 Versão não controlada pelo `app.json`

- Faltam `expo.version` e `expo.android.versionCode`. O prebuild reseta para 1. Ver 3.5.

### 8.10 Faixa etária nos Termos x público-alvo

- `docs/termos-de-uso.md` 1.2 e `docs/politica-de-privacidade.md` seção 10 permitem menores com supervisão. Ver 6.8 (recomendado 18+ para a publicação).

### 8.11 Não bloqueantes, mas vale saber

- **Nenhum lambda valida JWT** (descrito no CLAUDE.md). A revisão da Play não testa isso, mas em um app público de saúde mental qualquer pessoa com um `patientId` pode ler dados sensíveis. Hoje, "Todos os dados são criptografados em trânsito" é verdade; "dados protegidos" não seria. Considere corrigir antes de abrir para pacientes reais.
- `expo-dev-client` está nas dependências e `EX_DEV_CLIENT_NETWORK_INSPECTOR=true` no `gradle.properties`. Em `bundleRelease` o launcher de desenvolvimento não é ativado, mas se quiser um AAB mais limpo, pode remover para a build da loja.
- `android:allowBackup="true"` no manifest: o backup do Android inclui o `AsyncStorage`, onde fica o **token JWT**. Para app de saúde, `allowBackup: false` (via `app.json` > `android.allowBackup: false`) é mais seguro.
- Nome inconsistente: `Apsicare` (`app.json`) x `ApsiCare` (documentos, loja).
- `reactNativeArchitectures` inclui `x86`/`x86_64`. No AAB, a Play entrega só a arquitetura do aparelho; não precisa mudar.

---

## 9. Checklist final

**Conta**
- [ ] Conta Play Console pessoal criada, US$ 25 pagos com cartão não pré-pago
- [ ] Identidade verificada (documento + cartão no mesmo nome)
- [ ] Aparelho Android verificado pelo app Play Console

**Projeto**
- [ ] Keystore de upload gerada **fora do repo** + backup feito
- [ ] Senhas em `C:\Users\verin\.gradle\gradle.properties`
- [ ] `signingConfigs.release` aplicado **via config plugin** (sobrevive ao prebuild)
- [ ] `expo.version` e `expo.android.versionCode` no `app.json`
- [ ] Ícone, ícone adaptativo e splash configurados no `app.json`
- [ ] `blockedPermissions` para SYSTEM_ALERT_WINDOW / storage / AD_ID
- [ ] `npx expo prebuild --platform android` + conferir `build.gradle` e manifest
- [ ] `.\gradlew bundleRelease` → `android\app\build\outputs\bundle\release\app-release.aab`
- [ ] `keytool -printcert -jarfile` confirma que **não** é "Android Debug"
- [ ] targetSdk 36 confirmado

**Funcionalidades exigidas**
- [ ] Excluir conta dentro do app (paciente **e** psicólogo) + lambda que apaga tudo, inclusive S3
- [ ] Página web de exclusão de conta publicada
- [ ] Link de política no Health Connect abre a política de privacidade
- [ ] Transcrição de voz sem chave de API embutida no app (recomendado)

**Textos legais**
- [ ] Política corrigida: Groq (não HuggingFace), S3, SES, contato de emergência, IBI aproximado, dados do Health Connect sem publicidade/IA, prazo de exclusão
- [ ] Mesmo texto em `docs/`, `src/content/legalDocs.js` e na URL pública
- [ ] Política e termos publicados no GitHub Pages (repo público separado)
- [ ] E-mail de contato definitivo (não "noreply")

**Play Console: página da loja**
- [ ] Nome, descrição curta e completa (com aviso "não é dispositivo médico" e CVV 188)
- [ ] Ícone 512x512, feature graphic 1024x500, 4 a 8 screenshots com dados fictícios
- [ ] Categoria Saúde e fitness, e-mail, URL da política

**Play Console: Conteúdo do app**
- [ ] Acesso ao app: contas demo de psicólogo e paciente + instruções
- [ ] Anúncios: não
- [ ] Health apps declaration
- [ ] Declaração do Health Connect (somente Heart rate, justificativa)
- [ ] Data Safety conforme a tabela 6.5 + URL de exclusão
- [ ] Classificação de conteúdo (IARC)
- [ ] Público-alvo 18+
- [ ] ID de publicidade: não usa

**Lançamento**
- [ ] Teste interno enviado e testado no aparelho
- [ ] SHA-1 da chave de assinatura da Play adicionado no Firebase (push)
- [ ] Teste fechado com 15 a 20 testadores (Grupo do Google), 14 dias contínuos, pelo menos 1 atualização
- [ ] Pedido de acesso à produção respondido com detalhes
- [ ] Versão de produção enviada para revisão

---

## 10. Fontes oficiais

- Verificação de desenvolvedor Android (Brasil, 30/09/2026): https://developer.android.com/developer-verification
- Contas de distribuição limitada (estudantes, 20 aparelhos): https://developer.android.com/developer-verification/guides/limited-distribution
- Registro da conta Play Console (taxa US$ 25, identidade, aparelho): https://support.google.com/googleplay/android-developer/answer/6112435
- Requisitos de teste para contas pessoais novas (12 testadores / 14 dias): https://support.google.com/googleplay/android-developer/answer/14151465
- Requisitos da Play Console (categorias que exigem conta de organização): https://support.google.com/googleplay/android-developer/answer/10788890
- Target API level (API 36 desde 31/08/2026): https://developer.android.com/google/play/requirements/target-sdk
- Páginas de 16 KB: https://developer.android.com/guide/practices/page-sizes
- Android App Bundle: https://developer.android.com/guide/app-bundle
- Play App Signing: https://support.google.com/googleplay/android-developer/answer/9842756
- Expo, build de produção local: https://docs.expo.dev/guides/local-app-production/
- Política de Health Content and Services: https://support.google.com/googleplay/android-developer/answer/16679511
- Formulário Health apps declaration: https://support.google.com/googleplay/android-developer/answer/14738291
- Declarar acesso ao Health Connect: https://developer.android.com/health-and-fitness/guides/health-connect/publish/declare-access
- Android Health Permissions, guia e FAQ: https://support.google.com/googleplay/android-developer/answer/12991134
- Data safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Política de dados do usuário (divulgação em destaque, dados sensíveis): https://support.google.com/googleplay/android-developer/answer/10144311
- Permissões e APIs que acessam informações sensíveis: https://support.google.com/googleplay/android-developer/answer/16585319
- Exclusão de conta: https://support.google.com/googleplay/android-developer/answer/13327111
- Classificação de conteúdo: https://support.google.com/googleplay/android-developer/answer/9898843
- Público-alvo e conteúdo: https://support.google.com/googleplay/android-developer/answer/9867159
