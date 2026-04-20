import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { code } = body;

    if (!code) {
      return response(400, { error: "Código é obrigatório" });
    }

    const result = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `TOKEN#${code}`,
        SK: "RESET"
      }
    }));

    if (!result.Item) {
      return response(400, { error: "Código inválido ou expirado" });
    }

    if (result.Item.used) {
      return response(400, { error: "Código já utilizado" });
    }

    const now = Math.floor(Date.now() / 1000);
    if (result.Item.ttl < now) {
      return response(400, { error: "Código expirado" });
    }

    return response(200, { valid: true, email: result.Item.email });

  } catch (err) {
    console.error(err);
    return response(500, { error: "Erro interno do servidor" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  body: JSON.stringify(body)
});