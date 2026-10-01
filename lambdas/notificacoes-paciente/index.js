// GET   /patients/{patientId}/notifications
// PATCH /patients/{patientId}/notifications/{notificationId}/read
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ApsiCare";

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;
    const notificationId = event.pathParameters?.notificationId;
    const method = event.requestContext?.http?.method || event.httpMethod || "GET";
    if (!patientId) return response(400, { error: "patientId é obrigatório" });

    if (method === "PATCH" && notificationId) {
      await dynamo.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `PATIENT#${patientId}`, SK: `NOTIFICATION#${decodeURIComponent(notificationId)}` },
        UpdateExpression: "SET #data.isRead = :val",
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeNames: { "#data": "data" },
        ExpressionAttributeValues: { ":val": true },
      }));
      return response(200, { message: "Notificação marcada como lida" });
    }

    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: { ":pk": `PATIENT#${patientId}`, ":prefix": "NOTIFICATION#" },
      ScanIndexForward: false,
      Limit: 50,
    }));

    const notifications = (result.Items || []).map((item) => ({
      id: item.SK.split("#").slice(1).join("#"),
      createdAt: item.createdAt,
      category: item.data?.category,
      title: item.data?.title,
      body: item.data?.body,
      isRead: item.data?.isRead || false,
    }));

    return response(200, { notifications });
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return response(404, { error: "Notificação não encontrada" });
    }
    console.error("ERRO notificacoes-paciente:", err);
    return response(500, { error: "Erro interno do servidor" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body),
});
