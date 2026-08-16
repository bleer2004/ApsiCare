import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ApsiCare";

export const handler = async (event) => {
  try {
    const clinicianId = event.pathParameters?.clinicianId;

    if (!clinicianId) {
      return response(400, { error: "clinicianId é obrigatório" });
    }

    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": `CLINICIAN#${clinicianId}`,
        ":prefix": "NOTIFICATION#",
      },
      ScanIndexForward: false,
      Limit: 50,
    }));

    const notifications = (result.Items || []).map(item => ({
      id: item.SK.split("#").slice(1).join("#"),
      createdAt: item.createdAt,
      category: item.data?.category,
      title: item.data?.title,
      body: item.data?.body,
      isRead: item.data?.isRead || false,
      pushSent: item.data?.pushSent || false,
      patientId: item.data?.patientId,
      patientName: item.data?.patientName,
      relatedId: item.data?.relatedId,
    }));

    return response(200, { notifications });

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
