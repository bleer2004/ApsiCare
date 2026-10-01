#!/bin/bash
# Atualiza só as lambdas do fluxo de verificação de e-mail do SES (plano B do sandbox).
set -uo pipefail
cd "$(dirname "$0")"
for nome in enviar-convite forgot-password forgot-password-patient cadastro-patient cadastro-clinician; do
  aws lambda update-function-code --region sa-east-1 --function-name "$nome" --zip-file "fileb://zips/$nome.zip" >/dev/null \
    && aws lambda wait function-updated-v2 --region sa-east-1 --function-name "$nome" \
    && echo "  ✔ $nome atualizada" || echo "  ✘ $nome falhou"
done
