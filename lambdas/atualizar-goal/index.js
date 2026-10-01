import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ApsiCare";

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;
    const goalId = event.pathParameters?.goalId;
    const body = JSON.parse(event.body || "{}");
    const { status, progresso } = body;

    if (!patientId || !goalId || !status) {
      return response(400, { error: "patientId, goalId e status são obrigatórios" });
    }

    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `PATIENT#${patientId}`,
        SK: `GOAL#${goalId}`
      },
      UpdateExpression: "SET #status = :status, progresso = :progresso, updatedAt = :now",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": status,
        ":progresso": progresso || 'Em andamento',
        ":now": new Date().toISOString()
      }
    }));

    return response(200, { message: "Meta atualizada com sucesso" });

  } catch (err) {
    console.error(err);
    return response(500, { error: "Erro interno do servidor" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body)
});