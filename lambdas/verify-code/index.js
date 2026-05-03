import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const { code } = JSON.parse(event.body);

    const result = await dynamo.send(new GetCommand({
      TableName: "PsicoCare",
      Key: { PK: `TOKEN#${code}`, SK: "RESET" }
    }));

    const token = result.Item;
    const now = Math.floor(Date.now() / 1000);

    if (!token || token.used || token.ttl < now) {
      return response(400, { error: "Código inválido ou expirado" });
    }

    return response(200, { valid: true });
  } catch (err) {
    return response(500, { error: "Erro interno" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
  body: JSON.stringify(body)
});