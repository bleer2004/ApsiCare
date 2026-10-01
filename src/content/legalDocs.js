// Conteúdo dos documentos legais exibidos em src/screens/Legal/DocumentoLegal.js
// Placeholders [DATA], [CIDADE/UF] e [E-MAIL DE CONTATO] precisam ser preenchidos
// com os dados reais antes da publicação (mesmo texto usado em docs/termos-de-uso.md
// e docs/politica-de-privacidade.md).

export const termosDeUso = {
  titulo: 'Termos de Uso',
  atualizadoEm: '01/10/2026',
  blocos: [
    { tipo: 'p', texto: 'Estes Termos de Uso regulam o acesso e uso do aplicativo ApsiCare, disponível para os perfis de Paciente e Psicólogo/Clínico. Ao criar uma conta ou usar o Aplicativo, você declara que leu, entendeu e concorda com estes Termos e com a Política de Privacidade.' },
    { tipo: 'aviso', icone: 'info', texto: 'Natureza do projeto: o ApsiCare é um projeto acadêmico (TCC). Não é uma empresa constituída, não possui CNPJ, e é operado por sua equipe de desenvolvimento.' },

    { tipo: 'h2', texto: '1. Aceitação dos Termos' },
    { tipo: 'p', texto: '1.1. O uso do ApsiCare é condicionado à aceitação integral destes Termos, tanto por pacientes quanto por psicólogos/clínicos cadastrados.' },
    { tipo: 'p', texto: '1.2. O Aplicativo é destinado exclusivamente a maiores de 18 anos.' },
    { tipo: 'p', texto: '1.3. O cadastro de pacientes é feito por convite de um psicólogo já cadastrado no sistema. Ao aceitar esse convite e criar sua conta, o paciente concorda com estes Termos.' },

    { tipo: 'h2', texto: '2. Descrição do Serviço' },
    { tipo: 'p', texto: 'O ApsiCare conecta psicólogos e pacientes para acompanhamento psicológico contínuo, oferecendo:' },
    { tipo: 'bullet', texto: 'Registro de humor e diário pessoal (texto e voz) pelo paciente' },
    { tipo: 'bullet', texto: 'Leitura de dados fisiológicos (frequência cardíaca) via smartwatch conectado através do Android Health Connect' },
    { tipo: 'bullet', texto: 'Geração automática de insights sobre estresse físico e emocional' },
    { tipo: 'bullet', texto: 'Painel para o psicólogo acompanhar seus pacientes e receber alertas' },
    { tipo: 'bullet', texto: 'Notificações push para o psicólogo (sinais de risco, anotações compartilhadas) e lembretes do psicólogo para o paciente' },
    { tipo: 'p', texto: 'Passos, calorias e outras métricas não relacionadas a frequência cardíaca não são coletados.' },

    { tipo: 'h2', texto: '3. Cadastro e Conta' },
    { tipo: 'p', texto: '3.1. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.' },
    { tipo: 'p', texto: '3.2. As informações fornecidas no cadastro devem ser verdadeiras, completas e atualizadas.' },
    { tipo: 'p', texto: '3.3. É proibido compartilhar sua conta com terceiros ou usar a conta de outra pessoa sem autorização.' },
    { tipo: 'p', texto: '3.4. O psicólogo é responsável por convidar e gerenciar corretamente os pacientes vinculados à sua conta.' },

    { tipo: 'h2', texto: '4. Coleta e Uso de Dados' },
    { tipo: 'h3', texto: '4.1 Diário e registro de humor' },
    { tipo: 'p', texto: 'Você pode registrar como está se sentindo por texto, emojis/slider de humor ou gravação de voz. Fica disponível para você e para o psicólogo responsável, quando você optar por compartilhar.' },
    { tipo: 'h3', texto: '4.2 Análise por Inteligência Artificial de terceiros' },
    { tipo: 'p', texto: 'O texto que você escreve ou grava no Diário é enviado a serviços de IA de terceiros para gerar os insights de estresse/sentimento: OpenRouter (análise de sentimento/estresse) e Groq/Whisper (transcrição de voz).' },
    { tipo: 'aviso', icone: 'globe', texto: 'Esses provedores podem estar fora do Brasil — transferência internacional de dados (art. 33 da LGPD). Não inclua CPF, endereço ou dados de terceiros no Diário.' },
    { tipo: 'h3', texto: '4.3 Smartwatch e Health Connect (somente Android)' },
    { tipo: 'p', texto: 'O Aplicativo lê sua frequência cardíaca via Health Connect para estimar indicadores de estresse. Função indisponível em iOS.' },
    { tipo: 'h3', texto: '4.4 Insights não são diagnóstico' },
    { tipo: 'p', texto: 'Os insights são estimativas automatizadas e não constituem diagnóstico clínico, laudo psicológico ou orientação médica, nem substituem a avaliação do psicólogo responsável.' },
    { tipo: 'h3', texto: '4.5 Notificações' },
    { tipo: 'p', texto: 'Psicólogos podem receber notificações push (Android) sobre sinais de risco ou compartilhamento do diário — são apoio ao acompanhamento, não substituem julgamento clínico.' },

    { tipo: 'emergencia', titulo: '5. O ApsiCare não é um serviço de emergência', texto: 'Não é pronto-socorro, plantão psicológico ou atendimento de crise. Se você ou alguém que você conhece está em risco imediato, não use o app para pedir ajuda com urgência. Procure imediatamente:', contatos: [
      { nome: 'CVV — 24h, gratuito', numero: '188' },
      { nome: 'SAMU', numero: '192' },
      { nome: 'Emergência', numero: '190' },
    ]},

    { tipo: 'h2', texto: '6. Responsabilidades do Usuário' },
    { tipo: 'bullet', texto: 'Fornecer informações verdadeiras e não se passar por outra pessoa' },
    { tipo: 'bullet', texto: 'Não utilizar o Aplicativo para fins ilícitos' },
    { tipo: 'bullet', texto: 'Não tentar acessar contas ou dados que não sejam seus' },
    { tipo: 'bullet', texto: 'Não fazer engenharia reversa, copiar ou redistribuir o Aplicativo' },
    { tipo: 'bullet', texto: 'Usar os insights como apoio complementar, nunca como única base de decisão' },

    { tipo: 'h2', texto: '7. Responsabilidades do Psicólogo/Clínico' },
    { tipo: 'p', texto: 'O profissional cadastrado declara possuir registro profissional válido (CRP) e é o único responsável pelas condutas e decisões clínicas. O ApsiCare é ferramenta de apoio, não substitui o exercício profissional.' },

    { tipo: 'h2', texto: '8. Propriedade Intelectual' },
    { tipo: 'p', texto: 'O código-fonte, design, marca e demais elementos do ApsiCare pertencem à equipe responsável pelo seu desenvolvimento, no contexto de um projeto acadêmico (TCC).' },

    { tipo: 'h2', texto: '9. Conteúdo do Usuário' },
    { tipo: 'p', texto: 'Você mantém a titularidade sobre os textos, áudios e conteúdos que registra. Ao usar o app, você autoriza o processamento desse conteúdo pelos serviços da seção 4, só para gerar seus insights e permitir o acompanhamento.' },

    { tipo: 'h2', texto: '10. Natureza Experimental e Limitação de Responsabilidade' },
    { tipo: 'p', texto: '10.1. O ApsiCare é um projeto acadêmico/protótipo (TCC), fornecido "como está", sem garantias de disponibilidade contínua ou precisão absoluta dos dados.' },
    { tipo: 'p', texto: '10.2. Na máxima extensão permitida por lei, a equipe responsável não se responsabiliza por danos decorrentes do uso do app, incluindo indisponibilidade de serviços de terceiros ou perda de dados.' },
    { tipo: 'p', texto: '10.3. Nada nestes Termos exclui responsabilidades que não possam ser legalmente limitadas, como dolo ou culpa grave.' },

    { tipo: 'h2', texto: '11. Privacidade e Proteção de Dados (LGPD)' },
    { tipo: 'p', texto: 'O tratamento de dados pessoais e sensíveis é descrito em detalhe na Política de Privacidade, parte integrante destes Termos.' },

    { tipo: 'h2', texto: '12. Suspensão e Encerramento de Conta' },
    { tipo: 'p', texto: '12.1. O psicólogo exclui a própria conta em Configurações → Excluir conta (depois de excluir seus pacientes). O paciente pede a exclusão em Meus dados → Solicitar exclusão dos meus dados, e o psicólogo apaga todos os dados. Também é possível pedir pelo contato da seção 14. Prazo: até 30 dias.' },
    { tipo: 'p', texto: '12.2. Podemos suspender ou encerrar contas que violem estes Termos.' },

    { tipo: 'h2', texto: '13. Alterações nestes Termos' },
    { tipo: 'p', texto: 'Podemos atualizar estes Termos periodicamente. Alterações relevantes serão comunicadas dentro do Aplicativo.' },

    { tipo: 'h2', texto: '14. Legislação Aplicável, Foro e Contato' },
    { tipo: 'p', texto: 'Estes Termos são regidos pelas leis do Brasil. Fica eleito o foro da comarca de São Paulo, SP para dirimir controvérsias.' },
    { tipo: 'p', texto: 'Dúvidas ou solicitações: apsicare.noreply@gmail.com' },
  ],
};

export const politicaDePrivacidade = {
  titulo: 'Política de Privacidade',
  atualizadoEm: '01/10/2026',
  blocos: [
    { tipo: 'p', texto: 'Esta Política descreve como o ApsiCare coleta, usa, armazena e compartilha dados pessoais de pacientes e psicólogos/clínicos, em conformidade com a LGPD. Ela é parte integrante dos Termos de Uso.' },
    { tipo: 'aviso', icone: 'info', texto: 'Natureza do projeto: o ApsiCare é um projeto acadêmico (TCC), sem CNPJ, operado por sua equipe de desenvolvimento, que atua como controladora dos dados para fins da LGPD.' },

    { tipo: 'h2', texto: '1. Quem Somos (Controlador)' },
    { tipo: 'p', texto: 'A equipe responsável pelo desenvolvimento do ApsiCare é a controladora dos dados pessoais tratados neste Aplicativo. Dúvidas devem ser enviadas ao contato da seção 13.' },

    { tipo: 'h2', texto: '2. Quais Dados Coletamos' },
    { tipo: 'h3', texto: '2.1 Dados de cadastro' },
    { tipo: 'p', texto: 'Nome, e-mail, telefone e data de nascimento (paciente e psicólogo), registro profissional (psicólogo), diagnóstico/observações clínicas.' },
    { tipo: 'p', texto: 'Contato de emergência do paciente (nome, telefone e relação), cadastrado pelo psicólogo e usado só em situação de risco. Documentos anexados pelo psicólogo ficam no Amazon S3, visíveis só para o psicólogo e o paciente.' },
    { tipo: 'h3', texto: '2.2 Dados de saúde e bem-estar (dados sensíveis)' },
    { tipo: 'bullet', texto: 'Registros de humor e diário pessoal (texto e áudio)' },
    { tipo: 'bullet', texto: 'Frequência cardíaca (BPM), via Health Connect. O intervalo entre batimentos é estimado a partir do BPM, não lido do relógio' },
    { tipo: 'bullet', texto: 'Insights de estresse gerados a partir desses dados' },
    { tipo: 'h3', texto: 'Uso dos dados do Health Connect' },
    { tipo: 'p', texto: 'Pedimos somente a leitura de frequência cardíaca. Esses dados servem apenas para gerar seus indicadores de estresse (para você e seu psicólogo), não são usados para publicidade, não são vendidos e não são enviados aos provedores de IA (OpenRouter e Groq). O uso segue a Política de Permissões do Health Connect, incluindo os requisitos de uso limitado.' },
    { tipo: 'h3', texto: '2.3 Dados técnicos' },
    { tipo: 'bullet', texto: 'Token de autenticação e token de notificações push' },
    { tipo: 'bullet', texto: 'Registros de sincronização (data/hora dos envios)' },

    { tipo: 'h2', texto: '3. Dados Sensíveis e Base Legal' },
    { tipo: 'p', texto: 'Os dados de saúde são sensíveis nos termos do art. 5º, II da LGPD. O tratamento se baseia no consentimento específico e destacado (art. 11, I), obtido no aceite dos termos (cadastro do psicólogo ou primeiro acesso do paciente), no aviso do Diário e na permissão do Health Connect. Você pode revogar esse consentimento a qualquer momento.' },

    { tipo: 'h2', texto: '4. Para que Usamos os Dados' },
    { tipo: 'bullet', texto: 'Gerar insights de estresse e bem-estar para você e seu psicólogo' },
    { tipo: 'bullet', texto: 'Permitir que o psicólogo acompanhe sua evolução e sinais de risco' },
    { tipo: 'bullet', texto: 'Autenticar seu acesso e manter sua sessão' },
    { tipo: 'bullet', texto: 'Enviar notificações push (alertas ao psicólogo, lembretes ao paciente) e e-mails de convite e recuperação de senha' },
    { tipo: 'p', texto: 'Não usamos seus dados para publicidade, venda a terceiros, ou qualquer finalidade fora do acompanhamento psicológico.' },

    { tipo: 'h2', texto: '5. Com Quem Compartilhamos Dados' },
    { tipo: 'compartilhamento', servico: 'AWS (DynamoDB, Lambda)', finalidade: 'Armazenamento e processamento de todos os dados do app', local: 'Brasil (sa-east-1)', nacional: true },
    { tipo: 'compartilhamento', servico: 'AWS S3', finalidade: 'Armazenamento de documentos anexados ao paciente', local: 'Brasil (sa-east-1)', nacional: true },
    { tipo: 'compartilhamento', servico: 'AWS SES', finalidade: 'E-mails de convite e recuperação de senha', local: 'Brasil (sa-east-1)', nacional: true },
    { tipo: 'compartilhamento', servico: 'OpenRouter (Llama 3.1)', finalidade: 'Análise de sentimento/estresse do texto do Diário', local: 'Internacional', nacional: false },
    { tipo: 'compartilhamento', servico: 'Groq (Whisper)', finalidade: 'Transcrição de áudio em texto', local: 'Internacional', nacional: false },
    { tipo: 'compartilhamento', servico: 'Expo / Firebase (FCM)', finalidade: 'Entrega de notificações push (Android)', local: 'Internacional', nacional: false },
    { tipo: 'p', texto: 'Não compartilhamos dados com anunciantes, corretores de dados ou qualquer terceiro fora dessa lista.' },

    { tipo: 'h2', texto: '6. Transferência Internacional de Dados' },
    { tipo: 'aviso', icone: 'globe', texto: 'O envio de texto/áudio do Diário para OpenRouter e Groq caracteriza transferência internacional (art. 33 LGPD). Buscamos retenção zero de dados quando disponível, mas não temos controle total sobre a infraestrutura de terceiros.' },

    { tipo: 'h2', texto: '7. Por Quanto Tempo Guardamos os Dados' },
    { tipo: 'p', texto: 'Mantemos seus dados enquanto sua conta estiver ativa.' },
    { tipo: 'bullet', texto: 'Psicólogo: Configurações → Excluir conta (com senha, depois de excluir os pacientes)' },
    { tipo: 'bullet', texto: 'Paciente: Meus dados → Solicitar exclusão dos meus dados. O psicólogo apaga todos os seus dados no ApsiCare' },
    { tipo: 'p', texto: 'Pedidos de exclusão são atendidos em até 30 dias. Registros que o psicólogo mantém fora do app (prontuário profissional) seguem as normas do Conselho Federal de Psicologia.' },

    { tipo: 'h2', texto: '8. Como Protegemos Seus Dados' },
    { tipo: 'p', texto: 'Adotamos medidas técnicas razoáveis, como autenticação por token (JWT) e HTTPS. Por ser um projeto acadêmico em desenvolvimento, algumas práticas ainda estão em evolução. Agimos rapidamente em caso de incidente de segurança.' },

    { tipo: 'h2', texto: '9. Seus Direitos como Titular de Dados' },
    { tipo: 'p', texto: 'Nos termos do art. 18 da LGPD, você pode solicitar a qualquer momento:' },
    { tipo: 'bullet', texto: 'Confirmação da existência de tratamento e acesso aos seus dados' },
    { tipo: 'bullet', texto: 'Correção de dados incompletos, inexatos ou desatualizados' },
    { tipo: 'bullet', texto: 'Anonimização, bloqueio ou eliminação de dados desnecessários' },
    { tipo: 'bullet', texto: 'Portabilidade dos seus dados a outro fornecedor' },
    { tipo: 'bullet', texto: 'Eliminação dos dados tratados com base no seu consentimento' },
    { tipo: 'bullet', texto: 'Informação sobre com quem compartilhamos seus dados' },
    { tipo: 'bullet', texto: 'Revogação do consentimento, a qualquer momento' },
    { tipo: 'p', texto: 'Responderemos em até 15 dias (exclusão de conta: até 30 dias).' },

    { tipo: 'h2', texto: '10. Crianças e Adolescentes' },
    { tipo: 'p', texto: 'O ApsiCare é destinado exclusivamente a maiores de 18 anos. Contas de menores identificadas serão excluídas.' },

    { tipo: 'h2', texto: '11. Armazenamento Local no Dispositivo' },
    { tipo: 'p', texto: 'O Aplicativo guarda localmente (AsyncStorage) seu token de sessão, dados básicos de perfil, preferências de acessibilidade e o registro de consentimento do Diário. Não entram no backup do Android e são removidos ao sair da conta ou desinstalar o app.' },

    { tipo: 'h2', texto: '12. Alterações nesta Política' },
    { tipo: 'p', texto: 'Podemos atualizar esta Política periodicamente. Alterações relevantes serão comunicadas dentro do Aplicativo.' },

    { tipo: 'h2', texto: '13. Contato' },
    { tipo: 'p', texto: 'Para exercer seus direitos, tirar dúvidas ou solicitar exclusão de conta: apsicare.noreply@gmail.com' },
  ],
};
