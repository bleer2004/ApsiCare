#!/bin/bash
# Atualiza as lambdas com textos visíveis do nome do app (e-mails, notificação de exclusão, transcrição).
set -uo pipefail
cd "$(dirname "$0")"
for nome in enviar-convite forgot-password forgot-password-patient solicitar-exclusao-paciente transcrever-voz; do
  aws lambda update-function-code --region sa-east-1 --function-name "$nome" --zip-file "fileb://zips/$nome.zip" >/dev/null \
    && aws lambda wait function-updated-v2 --region sa-east-1 --function-name "$nome" \
    && echo "  ✔ $nome atualizada" || echo "  ✘ $nome falhou"
done
