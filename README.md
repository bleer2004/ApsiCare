# 🧠 Psicocare

## Sistema Inteligente de Apoio Clínico em Saúde Mental com Análise Multimodal de Dados via Dispositivos Vestíveis

---

# 📌 Descrição do Projeto

O **Psicocare** é uma plataforma digital desenvolvida com o objetivo de apoiar o acompanhamento clínico em saúde mental por meio da integração de **dados subjetivos fornecidos pelo paciente** e **dados fisiológicos coletados por dispositivos vestíveis**, como smartwatches.

A proposta do sistema é utilizar **técnicas de análise de dados e inteligência artificial** para identificar padrões comportamentais e emocionais ao longo do tempo, gerando **relatórios estruturados e insights analíticos** que podem auxiliar psicólogos e psiquiatras na compreensão do estado emocional de seus pacientes entre sessões terapêuticas.

O sistema não substitui a avaliação clínica profissional, sendo projetado como **ferramenta de apoio à tomada de decisão** no contexto terapêutico.

---

# 🎯 Problema de Pesquisa

No acompanhamento tradicional em saúde mental, a maior parte das informações utilizadas pelo profissional deriva do **relato verbal do paciente durante as sessões clínicas**. Esse modelo apresenta limitações importantes, como:

* dificuldade de lembrar eventos e emoções vivenciadas durante a semana;
* ausência de monitoramento contínuo entre sessões;
* falta de integração entre dados fisiológicos e estados emocionais;
* dificuldade em identificar padrões comportamentais ao longo do tempo.

Diante desse cenário, surge a seguinte questão de pesquisa:

**Como a integração de dados subjetivos e fisiológicos, analisados por técnicas de inteligência artificial, pode auxiliar profissionais de saúde mental no acompanhamento clínico de pacientes?**

---

# 🎯 Objetivos

## Objetivo Geral

Desenvolver um sistema digital que integre dados emocionais autorrelatados e dados fisiológicos provenientes de dispositivos vestíveis, utilizando técnicas de análise de dados para gerar relatórios estruturados que auxiliem no acompanhamento clínico em saúde mental.

---

## Objetivos Específicos

* Desenvolver um aplicativo móvel para registro diário de estados emocionais.
* Integrar dados fisiológicos coletados por dispositivos vestíveis.
* Implementar um sistema de análise de dados multimodais.
* Gerar relatórios semanais automatizados para apoio clínico.
* Desenvolver um painel de visualização para profissionais de saúde mental.

---

# 🧠 Fundamentação Teórica

O desenvolvimento do Psicocare está fundamentado em estudos relacionados a:

* **Saúde mental e monitoramento longitudinal**
* **Tecnologias digitais aplicadas à saúde**
* **Dispositivos vestíveis (wearables) na medicina**
* **Inteligência artificial aplicada à análise de dados em saúde**
* **Sistemas de apoio à decisão clínica**

Diversos estudos indicam que indicadores fisiológicos, como **variabilidade da frequência cardíaca (HRV)** e **qualidade do sono**, podem apresentar correlação com estados emocionais, como estresse e ansiedade. A integração desses dados com registros subjetivos pode fornecer uma visão mais completa do estado do paciente.

---

# 🧩 Funcionalidades do Sistema

## Funcionalidades para Pacientes

* registro diário de humor;
* registro de eventos relevantes;
* diário emocional;
* aplicação de questionários psicológicos padronizados;
* sincronização com dispositivos vestíveis;
* visualização básica de progresso emocional.

---

## Funcionalidades para Profissionais

* dashboard com pacientes cadastrados;
* linha do tempo emocional;
* visualização de tendências comportamentais;
* correlação entre dados fisiológicos e emocionais;
* geração automática de relatórios semanais;
* alertas configuráveis para variações significativas.

---

# 🤖 Uso de Inteligência Artificial

O sistema utiliza técnicas de **análise de dados multimodais** para processar informações provenientes de diferentes fontes, como:

* autorrelato de humor;
* registros de eventos diários;
* qualidade do sono;
* frequência cardíaca;
* variabilidade da frequência cardíaca (HRV);
* nível de atividade física.

Os algoritmos de análise têm como objetivo:

* identificar padrões temporais;
* detectar variações significativas nos dados;
* apontar possíveis correlações entre variáveis;
* gerar resumos analíticos para o profissional.

É importante destacar que o sistema **não realiza diagnóstico clínico**, nem substitui a avaliação de um profissional de saúde.

---

# 🏗 Arquitetura Tecnológica

A arquitetura do sistema é composta por três camadas principais:

### Aplicação Móvel

Desenvolvida utilizando:

* Flutter (Dart)

Responsável pela interface com o usuário e registro de dados emocionais.

---

### Backend

Implementado com:

* Node.js ou Python (FastAPI)

Responsável por:

* gerenciamento de usuários;
* armazenamento de dados;
* comunicação com dispositivos vestíveis;
* integração com o módulo de análise.

---

### Banco de Dados

Utiliza:

* PostgreSQL

Para armazenamento estruturado de:

* registros emocionais;
* dados fisiológicos;
* relatórios gerados;
* informações de usuários.

---

### Módulo de Inteligência Artificial

Desenvolvido em:

* Python
* biblioteca scikit-learn

Responsável pela análise de padrões e geração de insights.

---

# 🔒 Aspectos Éticos e Proteção de Dados

Considerando que o sistema trabalha com **dados sensíveis relacionados à saúde**, foram considerados os princípios da Lei Geral de Proteção de Dados (LGPD).

Entre as medidas adotadas estão:

* consentimento explícito do usuário;
* criptografia de dados sensíveis;
* controle de acesso por profissionais autorizados;
* anonimização de dados para fins de pesquisa.

---

# 📱 Aplicações Relacionadas

Durante a fase de pesquisa foram analisadas algumas aplicações existentes na área de saúde mental, tais como:

* Headspace
* Calm
* Daylio
* MindDoc

Embora essas plataformas ofereçam funcionalidades relevantes, nenhuma apresenta integração estruturada entre **dados subjetivos, dados fisiológicos e análise multimodal voltada ao acompanhamento clínico**.

---

# 📊 Resultados Esperados

Espera-se que o sistema permita:

* melhor organização das informações clínicas;
* identificação mais clara de padrões emocionais ao longo do tempo;
* apoio à análise do profissional durante sessões terapêuticas;
* maior continuidade no acompanhamento entre sessões.

---

# ⚠️ Limitações

Entre as limitações do projeto destacam-se:

* dependência da adesão do paciente ao registro de dados;
* possível variabilidade na precisão de dispositivos vestíveis;
* necessidade de validação clínica com amostras maiores.

---

# 👥 Autores
Verina Hani Mekhail Wadie
Ana Carolina Joaquim Januário
Eduarda Braga Portel

Projeto desenvolvido como **Trabalho de Conclusão de Curso (TCC)**.




Isso deixa o TCC **muito mais profissional para banca**.
