# Política de Privacidade do Apsicare

**Última atualização:** 01/10/2026

Esta Política de Privacidade descreve como o **Apsicare** ("Aplicativo", "App") coleta, usa, armazena e compartilha dados pessoais de seus usuários — pacientes e psicólogos/clínicos —, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, "LGPD"). Ela é parte integrante dos [Termos de Uso](./termos-de-uso.md).

> **Natureza do projeto:** o Apsicare é um projeto acadêmico (TCC), sem CNPJ, operado por sua equipe de desenvolvimento. Para fins da LGPD, essa equipe atua como **controladora** dos dados tratados pelo Aplicativo.

---

## 1. Quem somos (Controlador)

A equipe responsável pelo desenvolvimento do Apsicare é a controladora dos dados pessoais tratados neste Aplicativo. Por se tratar de um projeto acadêmico, não há uma pessoa jurídica constituída; dúvidas ou solicitações devem ser enviadas ao contato indicado na Seção 13.

## 2. Quais Dados Coletamos

### 2.1. Dados de cadastro
Nome, e-mail, telefone e data de nascimento (paciente e psicólogo), registro profissional (psicólogo), diagnóstico/observações clínicas (preenchidos pelo psicólogo sobre o paciente).

### 2.1.1. Dados de terceiros: contato de emergência
O psicólogo pode cadastrar um contato de emergência do paciente (nome, telefone e relação). Esse dado é usado apenas para o psicólogo contatar alguém em situação de risco, não é exibido a outros usuários e é apagado junto com a conta do paciente.

### 2.1.2. Documentos
Arquivos que o psicólogo anexa ao perfil do paciente (ex.: PDFs, imagens) ficam armazenados no Amazon S3 e só podem ser abertos pelo psicólogo e pelo próprio paciente.

### 2.2. Dados de saúde e bem-estar (dados sensíveis)

- Registros de humor e diário pessoal (texto e áudio);
- Frequência cardíaca (batimentos por minuto), lida do smartwatch via Android Health Connect. O intervalo entre batimentos usado nos cálculos é **estimado a partir do BPM**, não lido diretamente do relógio;
- *Insights* de estresse físico/emocional gerados a partir desses dados.

### 2.2.1. Uso dos dados do Health Connect
O Apsicare solicita **somente a permissão de leitura de frequência cardíaca** do Health Connect. Esses dados:

- são usados apenas para gerar os indicadores de estresse do próprio paciente e exibi-los a ele e ao psicólogo responsável;
- **não são usados para publicidade**, não são vendidos e não são compartilhados com terceiros para outras finalidades;
- **não são enviados aos provedores de inteligência artificial** (OpenRouter e Groq), que recebem apenas o texto e o áudio do Diário;
- são armazenados de forma agregada (média por minuto) na AWS, região Brasil.

O uso das informações recebidas do Health Connect segue a Política de Permissões do Health Connect, incluindo os requisitos de uso limitado.

### 2.3. Dados técnicos

- Token de autenticação (sessão) e token de notificações push;
- Registros de sincronização (data/hora dos envios de dados fisiológicos).

## 3. Dados Sensíveis e Base Legal

Os dados descritos na Seção 2.2 são **dados sensíveis** nos termos do art. 5º, II da LGPD (dados sobre saúde). Seu tratamento se baseia no **consentimento específico e destacado** do titular (art. 11, I), obtido: (a) no aceite destes termos ao criar a conta (psicólogo) ou ao criar a senha no primeiro acesso (paciente); (b) no aviso exibido ao abrir o Diário pela primeira vez; e (c) na tela de permissão do Health Connect, ao conectar o smartwatch.

Você pode revogar esse consentimento a qualquer momento, deixando de usar essas funcionalidades ou solicitando a exclusão dos dados já registrados (Seção 9).

## 4. Para que Usamos os Dados

- Gerar *insights* de estresse e bem-estar para você e para o psicólogo responsável pelo seu acompanhamento;
- Permitir que o psicólogo acompanhe a evolução do paciente e seja alertado sobre sinais de risco;
- Autenticar seu acesso e manter sua sessão no Aplicativo;
- Enviar notificações push relevantes: ao psicólogo (sinais de risco, anotações compartilhadas, pedidos de exclusão) e ao paciente (lembretes enviados pelo psicólogo);
- Enviar e-mails de convite e de recuperação de senha.

Não usamos seus dados para publicidade, venda a terceiros, ou qualquer finalidade fora do acompanhamento psicológico oferecido pelo Aplicativo.

## 5. Com Quem Compartilhamos Dados

| Serviço | Finalidade | Dados enviados | Localização |
|---|---|---|---|
| **AWS (DynamoDB, Lambda)** | Armazenamento e processamento de todos os dados do Aplicativo | Todos os dados de cadastro, saúde e uso | Brasil (região `sa-east-1`) |
| **AWS S3** | Armazenamento de documentos anexados ao perfil do paciente | Arquivos enviados pelo psicólogo | Brasil (região `sa-east-1`) |
| **AWS SES** | Envio de e-mails de convite e recuperação de senha | Nome, e-mail e código/senha provisória | Brasil (região `sa-east-1`) |
| **OpenRouter** (modelo Llama 3.1) | Análise de sentimento/estresse do texto do Diário | Texto do diário | Internacional |
| **Groq (Whisper)** | Transcrição de áudio em texto | Áudio gravado no Diário | Internacional |
| **Expo Push Service / Firebase (FCM)** | Entrega de notificações push (Android) | Token de notificação, título e texto curto da notificação | Internacional |

Não compartilhamos dados com anunciantes, corretores de dados ("data brokers") ou qualquer terceiro fora dessa lista.

## 6. Transferência Internacional de Dados

O envio de texto e áudio do Diário para **OpenRouter** e **Groq** (Seção 5) caracteriza transferência internacional de dados, nos termos do art. 33 da LGPD. Buscamos, quando disponível, contratar essas transferências sob configurações de **retenção zero de dados** ("Zero Data Retention") junto aos provedores, mas reconhecemos que não temos controle total sobre a infraestrutura desses terceiros. Essa limitação está documentada como ponto de atenção do projeto.

## 7. Por Quanto Tempo Guardamos os Dados

Mantemos seus dados enquanto sua conta estiver ativa, para permitir o acompanhamento contínuo do seu histórico junto ao psicólogo.

**Como excluir a conta:**

- **Psicólogo:** em Configurações → Excluir conta, confirmando a senha. A exclusão só é liberada depois de excluir todos os pacientes vinculados. Perfil, login e notificações são apagados na hora.
- **Paciente:** em Meus dados → Solicitar exclusão dos meus dados. O psicólogo responsável é avisado e faz a exclusão, que apaga **todos** os dados do paciente no Apsicare (perfil, diário, humor, insights, dados do smartwatch, documentos, lembretes e contato de emergência).
- Sem acesso ao app: pelo e-mail da Seção 13.

Pedidos de exclusão são atendidos em **até 30 dias**. Registros que o psicólogo mantém fora do Aplicativo (prontuário profissional) seguem as normas do Conselho Federal de Psicologia e não fazem parte do Apsicare.

## 8. Como Protegemos Seus Dados

Adotamos medidas técnicas razoáveis para proteger seus dados, como autenticação por token (JWT) no login e comunicação via HTTPS. Por ser um projeto acadêmico em desenvolvimento, algumas práticas de segurança ainda estão em evolução e não seguem necessariamente o mesmo padrão de um produto comercial maduro. Nenhum sistema é 100% livre de risco, e nos comprometemos a agir rapidamente em caso de incidente de segurança que afete seus dados.

## 9. Seus Direitos como Titular de Dados

Nos termos do art. 18 da LGPD, você pode solicitar, a qualquer momento e pelo contato da Seção 13:

- Confirmação da existência de tratamento dos seus dados;
- Acesso aos seus dados;
- Correção de dados incompletos, inexatos ou desatualizados;
- Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;
- Portabilidade dos seus dados a outro fornecedor de serviço;
- Eliminação dos dados pessoais tratados com base no seu consentimento;
- Informação sobre com quem compartilhamos seus dados;
- Revogação do consentimento, a qualquer momento.

Responderemos às solicitações em até 15 dias (exclusão de conta: até 30 dias, ver Seção 7).

## 10. Crianças e Adolescentes

O Apsicare é destinado **exclusivamente a maiores de 18 anos**. Não coletamos intencionalmente dados de menores de idade; se identificarmos uma conta de menor, ela será excluída.

## 11. Armazenamento Local no Dispositivo

O Aplicativo guarda localmente no seu dispositivo (via `AsyncStorage`), entre outros: seu token de sessão, dados de perfil básicos, preferências de acessibilidade e o registro de que você já leu o aviso de consentimento do Diário. Esses dados ficam no seu aparelho, não entram no backup automático do Android e são removidos ao sair da conta, desinstalar o app ou limpar seus dados.

## 12. Alterações nesta Política

Podemos atualizar esta Política periodicamente para refletir mudanças no Aplicativo ou na legislação aplicável. Alterações relevantes serão comunicadas dentro do Aplicativo. O uso continuado após a atualização representa concordância com a política revisada.

## 13. Contato

Para exercer seus direitos como titular de dados, tirar dúvidas sobre esta Política ou solicitar a exclusão da sua conta, entre em contato: **apsicare.noreply@gmail.com**
