#!/bin/bash
# Uso no AWS CloudShell:  bash deploy.sh plan   (só mostra)   |   bash deploy.sh apply   (aplica)
set -uo pipefail

MODE="${1:-plan}"
REGION="sa-east-1"
API_ID="2ube699efh"
ZIPS="$(cd "$(dirname "$0")" && pwd)/zips"
export AWS_DEFAULT_REGION="$REGION"
TAGS="environment=GRADUACAO,project=TCC,group=CIC404,creator=VERINAWADIE_23012668,owner=BOSSINI"

# lambdas existentes cujo código mudou (ou cujo zip antigo estava desatualizado)
ATUALIZAR=(
  analisar-texto atualizar-clinician atualizar-goal atualizar-paciente atualizar-senha-clinician
  cadastro-clinician cadastro-patient enviar-convite forgot-password forgot-password-patient
  gerar-insight get-contato-emergencia listar-insights login registrar-push-token
  reset-password reset-password-patient salvar-contato-emergencia verify-code-patient
  deletar-documento deletar-goal get-clinician health-ingest listar-alerts listar-goals
  listar-patients registrar-physio upload-documento verify-code
  get-paciente get-configuracoes-paciente atualizar-configuracoes-paciente
  listar-notificacoes marcar-notificacao-lida
)

# nome|runtime(node|python)|timeout|memoria
CRIAR=(
  "transcrever-voz|python|30|256"
  "excluir-paciente|node|30|256"
  "excluir-conta-clinician|node|15|256"
  "solicitar-exclusao-paciente|node|15|128"
  "lembretes-paciente|node|15|128"
  "notificacoes-paciente|node|10|128"
  "get-paciente|node|10|128"
  "get-configuracoes-paciente|node|10|128"
  "atualizar-configuracoes-paciente|node|10|128"
  "listar-notificacoes|node|10|128"
  "marcar-notificacao-lida|node|10|128"
)

# "METODO /rota|lambda"
ROTAS=(
  "POST /transcrever-voz|transcrever-voz"
  "DELETE /clinicians/{clinicianId}/patients/{patientId}|excluir-paciente"
  "POST /clinicians/{clinicianId}/excluir-conta|excluir-conta-clinician"
  "POST /patients/{patientId}/solicitar-exclusao|solicitar-exclusao-paciente"
  "GET /patients/{patientId}/lembretes|lembretes-paciente"
  "POST /patients/{patientId}/lembretes|lembretes-paciente"
  "POST /patients/{patientId}/lembretes/enviar|lembretes-paciente"
  "DELETE /patients/{patientId}/lembretes/{lembreteId}|lembretes-paciente"
  "GET /patients/{patientId}/notifications|notificacoes-paciente"
  "PATCH /patients/{patientId}/notifications/{notificationId}/read|notificacoes-paciente"
  "GET /clinicians/patients/{id}|get-paciente"
  "PUT /clinicians/patients/{id}|atualizar-paciente"
  "GET /patients/{patientId}/configuracoes|get-configuracoes-paciente"
  "PUT /patients/{patientId}/configuracoes|atualizar-configuracoes-paciente"
  "GET /clinicians/{clinicianId}/notifications|listar-notificacoes"
  "PATCH /clinicians/{clinicianId}/notifications/{notificationId}/read|marcar-notificacao-lida"
)

# ajustes mínimos de configuração: nome|timeout|memoria
CONFIG=(
  "gerar-insight|30|256"
  "analisar-texto|30|128"
  "login|10|256"
  "login-patient|10|256"
  "reset-password|10|256"
  "reset-password-patient|10|256"
  "atualizar-senha-clinician|10|256"
  "cadastro-clinician|10|256"
  "cadastro-patient|10|256"
)

azul() { printf '\n\033[1;34m== %s ==\033[0m\n' "$1"; }
ok() { printf '  \033[32m✔\033[0m %s\n' "$1"; }
plano() { printf '  \033[33m→\033[0m %s\n' "$1"; }
erro() { printf '  \033[31m✘\033[0m %s\n' "$1"; FALHAS=$((FALHAS+1)); }
FALHAS=0
aplicar() { [ "$MODE" = "apply" ]; }

existe() { aws lambda get-function --function-name "$1" >/dev/null 2>&1; }
normaliza() { echo "$1" | sed -E 's/\{[^}]+\}/{}/g'; }

azul "Conta e referências"
ACCOUNT=$(aws sts get-caller-identity --query Account --output text) || { echo "Sem acesso à AWS"; exit 1; }
ok "Conta: $ACCOUNT  | Região: $REGION  | Modo: $MODE"
REF=$(aws lambda get-function-configuration --function-name login --output json) || { echo "Lambda 'login' não encontrada — confira a região"; exit 1; }
ROLE=$(echo "$REF" | jq -r .Role)
NODE_RT=$(echo "$REF" | jq -r .Runtime)
PY_RT=$(aws lambda get-function-configuration --function-name gerar-insight --query Runtime --output text 2>/dev/null || echo python3.12)
ROLE_S3=$(aws lambda get-function-configuration --function-name deletar-documento --query Role --output text 2>/dev/null || echo "$ROLE")
ok "Role reaproveitada: $ROLE"
ok "Role com S3 (para excluir-paciente): $ROLE_S3"
ok "Runtimes: $NODE_RT / $PY_RT"
API_TYPE=$(aws apigatewayv2 get-api --api-id "$API_ID" --query ProtocolType --output text 2>/dev/null || echo "NAO_ENCONTRADA")
ok "API Gateway $API_ID: $API_TYPE"

azul "Criar lambdas novas"
for linha in "${CRIAR[@]}"; do
  IFS='|' read -r nome rt timeout mem <<<"$linha"
  if existe "$nome"; then ok "$nome já existe"; continue; fi
  [ -f "$ZIPS/$nome.zip" ] || { erro "$nome: zip não encontrado"; continue; }
  if [ "$rt" = "python" ]; then runtime="$PY_RT"; else runtime="$NODE_RT"; fi
  if [ "$nome" = "excluir-paciente" ]; then role="$ROLE_S3"; else role="$ROLE"; fi
  env_arg=()
  if [ "$nome" = "transcrever-voz" ]; then
    if aplicar; then
      read -rsp "  Cole a GROQ_API_KEY (não aparece na tela) e Enter: " GROQ; echo
      env_arg=(--environment "Variables={GROQ_API_KEY=$GROQ}")
    fi
  fi
  plano "criar $nome ($runtime, index.handler, ${timeout}s, ${mem}MB, com tags do TCC)"
  if aplicar; then
    aws lambda create-function --function-name "$nome" --runtime "$runtime" --role "$role" \
      --handler index.handler --timeout "$timeout" --memory-size "$mem" --tags "$TAGS" \
      --zip-file "fileb://$ZIPS/$nome.zip" "${env_arg[@]}" >/dev/null \
      && aws lambda wait function-active-v2 --function-name "$nome" && ok "$nome criada" || erro "$nome: falha ao criar"
  fi
done

azul "Atualizar código das lambdas existentes"
for nome in "${ATUALIZAR[@]}"; do
  [ -f "$ZIPS/$nome.zip" ] || { erro "$nome: zip não encontrado"; continue; }
  if ! existe "$nome"; then
    if aplicar; then erro "$nome não existe na AWS (pulada)"; else plano "$nome ainda não existe (é criada acima se estiver na lista de novas)"; fi
    continue
  fi
  plano "atualizar código de $nome"
  if aplicar; then
    aws lambda update-function-code --function-name "$nome" --zip-file "fileb://$ZIPS/$nome.zip" >/dev/null \
      && aws lambda wait function-updated-v2 --function-name "$nome" && ok "$nome atualizada" || erro "$nome: falha ao atualizar"
  fi
done

azul "Ajustar timeout/memória"
for linha in "${CONFIG[@]}"; do
  IFS='|' read -r nome timeout mem <<<"$linha"
  existe "$nome" || { erro "$nome não existe"; continue; }
  atual=$(aws lambda get-function-configuration --function-name "$nome" --query '[Timeout,MemorySize,Handler]' --output text)
  read -r t m h <<<"$atual"
  [ "$t" -lt "$timeout" ] && novo_t=$timeout || novo_t=$t
  [ "$m" -lt "$mem" ] && novo_m=$mem || novo_m=$m
  if [[ "$nome" == "gerar-insight" || "$nome" == "analisar-texto" ]] && [ "$h" != "index.handler" ]; then
    erro "$nome está com handler '$h' (deveria ser index.handler) — corrigindo"
    handler_arg=(--handler index.handler)
  else
    handler_arg=()
  fi
  if [ "$novo_t" = "$t" ] && [ "$novo_m" = "$m" ] && [ ${#handler_arg[@]} -eq 0 ]; then ok "$nome ok (${t}s, ${m}MB)"; continue; fi
  plano "$nome: ${t}s/${m}MB → ${novo_t}s/${novo_m}MB"
  if aplicar; then
    aws lambda update-function-configuration --function-name "$nome" --timeout "$novo_t" --memory-size "$novo_m" "${handler_arg[@]}" >/dev/null \
      && aws lambda wait function-updated-v2 --function-name "$nome" && ok "$nome ajustada" || erro "$nome: falha ao ajustar"
  fi
done

azul "Rotas no API Gateway"
if [ "$API_TYPE" != "HTTP" ]; then
  erro "A API $API_ID não é HTTP API ($API_TYPE). As rotas precisam ser criadas pelo console — me mande esta saída."
else
  ROTAS_ATUAIS=$(aws apigatewayv2 get-routes --api-id "$API_ID" --output json)
  INTEGRACOES=$(aws apigatewayv2 get-integrations --api-id "$API_ID" --output json)
  for linha in "${ROTAS[@]}"; do
    IFS='|' read -r route_key nome <<<"$linha"
    alvo_norm=$(normaliza "$route_key")
    existente=$(echo "$ROTAS_ATUAIS" | jq -r --arg alvo "$alvo_norm" \
      '.Items[] | select((.RouteKey | gsub("\\{[^}]+\\}"; "{}")) == $alvo) | "\(.RouteKey)|\(.Target // "")"' | head -1)
    if [ -n "$existente" ]; then
      IFS='|' read -r rk_existente target <<<"$existente"
      integ_id="${target#integrations/}"
      uri=$(echo "$INTEGRACOES" | jq -r --arg id "$integ_id" '.Items[] | select(.IntegrationId == $id) | .IntegrationUri')
      if [[ "$uri" == *":function:$nome"* ]]; then ok "$rk_existente → $nome"
      else erro "$rk_existente já existe mas aponta pra ${uri##*:function:} (esperado: $nome) — confira no console"; fi
      [ "$rk_existente" != "$route_key" ] && plano "obs: nomes de parâmetro diferentes ($rk_existente vs $route_key) — confira se a lambda lê o nome certo"
      continue
    fi
    plano "criar rota $route_key → $nome"
    aplicar || continue
    existe "$nome" || { erro "$nome não existe; rota $route_key não criada"; continue; }
    arn="arn:aws:lambda:$REGION:$ACCOUNT:function:$nome"
    integ_id=$(echo "$INTEGRACOES" | jq -r --arg arn "$arn" '.Items[] | select(.IntegrationUri == $arn) | .IntegrationId' | head -1)
    if [ -z "$integ_id" ]; then
      integ_id=$(aws apigatewayv2 create-integration --api-id "$API_ID" --integration-type AWS_PROXY \
        --integration-uri "$arn" --payload-format-version 2.0 --query IntegrationId --output text) || { erro "falha na integração de $nome"; continue; }
      INTEGRACOES=$(aws apigatewayv2 get-integrations --api-id "$API_ID" --output json)
    fi
    aws apigatewayv2 create-route --api-id "$API_ID" --route-key "$route_key" --target "integrations/$integ_id" >/dev/null \
      && ok "rota $route_key criada" || { erro "falha ao criar rota $route_key"; continue; }
    aws lambda add-permission --function-name "$nome" --statement-id "apigw-$API_ID-$(echo "$route_key" | md5sum | cut -c1-10)" \
      --action lambda:InvokeFunction --principal apigateway.amazonaws.com \
      --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT:$API_ID/*/*" >/dev/null 2>&1 || true
  done

  if aplicar; then
    for stage in $(aws apigatewayv2 get-stages --api-id "$API_ID" --query 'Items[?AutoDeploy==`false`].StageName' --output text); do
      aws apigatewayv2 create-deployment --api-id "$API_ID" --stage-name "$stage" >/dev/null && ok "deploy do stage $stage" || erro "falha no deploy do stage $stage"
    done
  fi
fi

azul "Resumo"
if [ "$FALHAS" -gt 0 ]; then echo "  $FALHAS problema(s) — me mande a saída acima."; else echo "  Tudo certo."; fi
[ "$MODE" = "plan" ] && echo "  Nada foi alterado (modo plan). Pra aplicar: bash deploy.sh apply"
