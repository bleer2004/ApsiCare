import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ApsiCare";

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;

    if (!patientId) {
      return response(400, { error: "patientId é obrigatório" });
    }

    const body = JSON.parse(event.body || "{}");
    const { configuracoesApp } = body;

    if (!configuracoesApp) {
      return response(400, { error: "configuracoesApp é obrigatório" });
    }

    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `PATIENT#${patientId}`, SK: `PATIENT#${patientId}` },
      UpdateExpression: "SET configuracoesApp = :configuracoesApp, #updatedAt = :updatedAt",
      ExpressionAttributeNames: { "#updatedAt": "updatedAt" },
      ExpressionAttributeValues: {
        ":configuracoesApp": configuracoesApp,
        ":updatedAt": new Date().toISOString(),
      },
    }));

    return response(200, { message: "Configurações atualizadas com sucesso", configuracoesApp });

  } catch (err) {
    console.error(err);
    return response(500, { error: "Erro interno do servidor" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});
