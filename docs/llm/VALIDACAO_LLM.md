# Validação da LLM

## Objetivo

Validar a capacidade da LLM de interpretar autorrelatos em diferentes cenários clínicos e gerar um `stress_score` coerente antes da integração ao cálculo do estresse subjetivo.

Foram elaborados 31 autorrelatos contemplando diferentes níveis de estresse e contextos emocionais.

Os relatos foram agrupados nas seguintes categorias:

### Categorias de estresse

As Categorias de Estresse possuem 5 casos para cada uma das cinco faixas quantitativas:

- **Baixo (0,00 ≤ x < 0,20):** : relatos sem sinais relevantes de estresse, compostos predominantemente por emoções positivas, bem-estar ou situações cotidianas sem sobrecarga.

- **Leve (0,20 ≤ x < 0,40):** relatos com pequenas preocupações, desconfortos ou situações pontuais de tensão, mas sem impacto significativo no funcionamento diário.

- **Moderado (0,40 ≤ x < 0,60):** relatos que apresentam estresse perceptível, com preocupações, cansaço ou sobrecarga moderada, porém sem perda importante da capacidade de lidar com as atividades do dia a dia.

- **Alto (0,60 ≤ x < 0,80):** relatos com sofrimento emocional significativo, ansiedade ou elevada sobrecargar, capazes de impactar o funcionamento diário, mas sem caracterizar uma situação extrema.

- **Muito alto (0,80 ≤ x ≤ 1,00):** relatos com estresse intenso, frequentemente associados a crises de ansiedade, incapacidade funcional, sofrimento emocional severo ou sintomas físicos importantes

### Categorias Específicas de Validação

As Categorias de Específicas de Validação possuem 3 casos cada faixa quantitativa:

- **Recuperação:** relatos que apresentam sinais de estresse ini+cialmente, mas também descrevem fatores de recuperação ou melhora ao longo da narrativa. O objetivo é verificar se a LLM considera essas informações ao calcular o 'stress_score', evitando superestimar o nível final de estresse.

- **Casos de análise exploratória:** relatos utilizados para analisar o comportamento da LLM em situações emocionalmente complexas, ambíguasm ou que não representam necessariamente um quadro de estresse. Esses casos são analisados qualitativamente e usados para discutir possíveis limitações do modelo.

Cada resposta da LLM foi avaliada quanto à coerência do `stress_score`, do sentimento e das palavras-chave retornadas.

### Critério de aprovação

Um caso foi considerado **aprovado** quando:

- o `stress_score` retornado permaneceu dentro da faixa esperada (ou muito próximo dela);
- o sentimento foi coerente com o contexto descrito no autorrelato;
- as palavras-chave representaram adequadamente o conteúdo do relato;
- a LLM não inferiu sintomas ou informações que não estavam explicitamente presentes no texto.

Os resultados completos encontram-se na planilha de validação (casos_de_teste).