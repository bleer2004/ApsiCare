# Política de Privacidade do ApsiCare

**Última atualização:** 10/09/2026

Esta Política de Privacidade descreve como o **ApsiCare** ("Aplicativo", "App") coleta, usa, armazena e compartilha dados pessoais de seus usuários — pacientes e psicólogos/clínicos —, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, "LGPD"). Ela é parte integrante dos [Termos de Uso](./termos-de-uso.md).

> **Natureza do projeto:** o ApsiCare é um projeto acadêmico (TCC), sem CNPJ, operado por sua equipe de desenvolvimento. Para fins da LGPD, essa equipe atua como **controladora** dos dados tratados pelo Aplicativo.

---

## 1. Quem somos (Controlador)

A equipe responsável pelo desenvolvimento do ApsiCare é a controladora dos dados pessoais tratados neste Aplicativo. Por se tratar de um projeto acadêmico, não há uma pessoa jurídica constituída; dúvidas ou solicitações devem ser enviadas ao contato indicado na Seção 13.

## 2. Quais Dados Coletamos

### 2.1. Dados de cadastro
Nome, e-mail, telefone e data de nascimento (paciente e psicólogo), diagnóstico/observações clínicas (preenchidos pelo psicólogo sobre o paciente).

### 2.2. Dados de saúde e bem-estar (dados sensíveis)
- Registros de humor e diário pessoal (texto e áudio);
- Frequência cardíaca e intervalos entre batimentos, lidos do smartwatch via Android Health Connect;
- *Insights* de estresse físico/emocional gerados a partir desses dados.

### 2.3. Dados técnicos
- Token de autenticação (sessão) e token de notificações push;
- Registros de sincronização (data/hora dos envios de dados fisiológicos).

## 3. Dados Sensíveis e Base Legal

Os dados descritos na Seção 2.2 são **dados sensíveis** nos termos do art. 5º, II da LGPD (dados sobre saúde). Seu tratamento se baseia no **consentimento específico e destacado** do titular (art. 11, I), obtido no momento em que você usa as funcionalidades de Diário/Humor e Smartwatch pela primeira vez, através dos avisos exibidos no próprio Aplicativo.

Você pode revogar esse consentimento a qualquer momento, deixando de usar essas funcionalidades ou solicitando a exclusão dos dados já registrados (Seção 9).

## 4. Para que Usamos os Dados

- Gerar *insights* de estresse e bem-estar para você e para o psicólogo responsável pelo seu acompanhamento;
- Permitir que o psicólogo acompanhe a evolução do paciente e seja alertado sobre sinais de risco;
- Autenticar seu acesso e manter sua sessão no Aplicativo;
- Enviar notificações push relevantes (hoje, apenas para o psicólogo).

Não usamos seus dados para publicidade, venda a terceiros, ou qualquer finalidade fora do acompanhamento psicológico oferecido pelo Aplicativo.

## 5. Com Quem Compartilhamos Dados

| Serviço | Finalidade | Dados enviados | Localização |
|---|---|---|---|
| **AWS (DynamoDB, Lambda)** | Armazenamento e processamento de todos os dados do Aplicativo | Todos os dados de cadastro, saúde e uso | Brasil (região `sa-east-1`) |
| **OpenRouter** (modelo Llama 3.1) | Análise de sentimento/estresse do texto do Diário | Texto do diário | Internacional |
| **HuggingFace (Whisper)** | Transcrição de áudio em texto | Áudio gravado no Diário | Internacional |
| **Expo Push Service / Firebase (FCM)** | Entrega de notificações push (Android) | Token de notificação (não o conteúdo dos dados) | Internacional |

Não compartilhamos dados com anunciantes, corretores de dados ("data brokers") ou qualquer terceiro fora dessa lista.

## 6. Transferência Internacional de Dados

O envio de texto e áudio do Diário para **OpenRouter** e **HuggingFace** (Seção 5) caracteriza transferência internacional de dados, nos termos do art. 33 da LGPD. Buscamos, quando disponível, contratar essas transferências sob configurações de **retenção zero de dados** ("Zero Data Retention") junto aos provedores, mas reconhecemos que não temos controle total sobre a infraestrutura desses terceiros. Essa limitação está documentada como ponto de atenção do projeto.

## 7. Por Quanto Tempo Guardamos os Dados

Mantemos seus dados enquanto sua conta estiver ativa, para permitir o acompanhamento contínuo do seu histórico junto ao psicólogo. Ao solicitar a exclusão da conta (Seção 9), seus dados pessoais e de saúde são removidos de nossa base em prazo razoável, exceto quando a manutenção for exigida por obrigação legal.

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

Responderemos às solicitações em prazo razoável, considerando a natureza acadêmica e a estrutura reduzida da equipe responsável pelo Aplicativo.

## 10. Crianças e Adolescentes

O Aplicativo pode ser usado por menores de 18 anos apenas com autorização e supervisão de responsável legal, e sempre vinculados a um psicólogo responsável cadastrado na plataforma, conforme previsto nos Termos de Uso.

## 11. Armazenamento Local no Dispositivo

O Aplicativo guarda localmente no seu dispositivo (via `AsyncStorage`), entre outros: seu token de sessão, dados de perfil básicos, preferências de acessibilidade e o registro de que você já leu o aviso de consentimento do Diário. Esses dados ficam no seu aparelho e são removidos ao desinstalar o app ou limpar seus dados.

## 12. Alterações nesta Política

Podemos atualizar esta Política periodicamente para refletir mudanças no Aplicativo ou na legislação aplicável. Alterações relevantes serão comunicadas dentro do Aplicativo. O uso continuado após a atualização representa concordância com a política revisada.

## 13. Contato

Para exercer seus direitos como titular de dados, tirar dúvidas sobre esta Política ou solicitar a exclusão da sua conta, entre em contato: **apsicare.noreply@gmail.com**
