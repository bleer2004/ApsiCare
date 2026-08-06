# Validação da LLM

## Objetivo

Validar a capacidade da LLM de interpretar autorrelatos e gerar um `stress_score` coerente antes da integração ao cálculo do estresse subjetivo.

Foram elaborados 30 autorrelatos contemplando diferentes níveis de estresse e contextos emocionais.

Os relatos foram agrupados nas seguintes categorias de estresse:

- **Baixo:** 0.00–0.20
- **Leve:** 0.20–0.40
- **Moderado:** 0.40–0.60
- **Alto:** 0.60–0.80
- **Muito alto:** 0.80–1.00

Cada resposta da LLM foi avaliada quanto à coerência do `stress_score`, do sentimento e das palavras-chave retornadas.

### Critério de aprovação

Um caso foi considerado **aprovado** quando:

- o `stress_score` retornado permaneceu dentro da faixa esperada (ou muito próximo dela);
- o sentimento foi coerente com o contexto descrito no autorrelato;
- as palavras-chave representaram adequadamente o conteúdo do relato;
- a LLM não inferiu sintomas ou informações que não estavam explicitamente presentes no texto.

Os resultados completos encontram-se na planilha de validação (casos_de_teste).