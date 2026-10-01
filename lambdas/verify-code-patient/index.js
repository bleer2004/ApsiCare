// POST /auth/patient/verify-code
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

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

  const { code } = body;
  const email = body.email?.trim().toLowerCase();
  if (!email || !code) return resp(400, { error: "email e code são obrigatórios" });

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
      return resp(400, { error: "Código inválido ou expirado" });
    }

    if (!paciente.resetCode || paciente.resetCode !== code) {
      return resp(400, { error: "Código inválido ou expirado" });
    }

    if (new Date() > new Date(paciente.resetCodeExpires)) {
      return resp(400, { error: "Código expirado. Solicite um novo." });
    }

    return resp(200, { message: "Código válido", valid: true });

  } catch (err) {
    console.error(err);
    return resp(500, { error: "Erro interno" });
  }
};

const resp = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body)
});