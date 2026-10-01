// POST /auth/patient/reset-password
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE = "ApsiCare";

export const handler = async (event) => {
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return resp(400, { error: "Body inválido" });
  }

  const { code, newPassword, termsAccepted } = body;
  const email = body.email?.trim().toLowerCase();
  if (!email || !code || !newPassword) {
    return resp(400, { error: "email, code e newPassword são obrigatórios" });
  }
  if (newPassword.length < 6) {
    return resp(400, { error: "A senha deve ter no mínimo 6 caracteres" });
  }

  try {
    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE,
      IndexName: "GSI1PK-GSI1SK-index",
      KeyConditionExpression: "GSI1PK = :gsi1pk",
      ExpressionAttributeValues: {
        ":gsi1pk": `EMAIL#${email}`
      }
    }));

    const paciente = (result.Items || []).find(item => item.type === "PATIENT");

    if (!paciente) {
      return resp(400, { error: "Solicitação inválida" });
    }

    if (!paciente.resetCode || paciente.resetCode !== code) {
      return resp(400, { error: "Código inválido" });
    }

    if (new Date() > new Date(paciente.resetCodeExpires)) {
      return resp(400, { error: "Código expirado. Solicite um novo." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 8);
    const now = new Date().toISOString();
    const setTermos = termsAccepted === true ? ", termsAcceptedAt = :now" : "";

    await dynamo.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: paciente.PK, SK: paciente.SK },
      UpdateExpression: `
        SET passwordHash = :hash,
            mustChangePassword = :false,
            updatedAt = :now${setTermos}
        REMOVE resetCode, resetCodeExpires, tempPassword
      `,
      ExpressionAttributeValues: {
        ":hash": passwordHash,
        ":false": false,
        ":now": now
      }
    }));

    return resp(200, { message: "Senha redefinida com sucesso" });

  } catch (err) {
    console.error(err);
    return resp(500, { error: "Erro interno ao redefinir senha" });
  }
};

const resp = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body)
});