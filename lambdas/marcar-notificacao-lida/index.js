import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ApsiCare";

export const handler = async (event) => {
  try {
    const clinicianId = event.pathParameters?.clinicianId;
    const notificationId = event.pathParameters?.notificationId;

    if (!clinicianId || !notificationId) {
      return response(400, { error: "clinicianId e notificationId são obrigatórios" });
    }

    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CLINICIAN#${clinicianId}`,
        SK: `NOTIFICATION#${decodeURIComponent(notificationId)}`,
      },
      UpdateExpression: "SET #data.isRead = :val",
      ExpressionAttributeNames: { "#data": "data" },
      ExpressionAttributeValues: { ":val": true },
    }));

    return response(200, { message: "Notificação marcada como lida" });

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
