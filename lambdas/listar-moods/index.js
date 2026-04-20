import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;
    const limit = parseInt(event.queryStringParameters?.limit || "30");

    if (!patientId) {
      return response(400, { error: "patientId é obrigatório" });
    }

    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": `PATIENT#${patientId}`,
        ":prefix": "MOOD#"
      },
      ScanIndexForward: false, // mais recente primeiro
      Limit: limit
    }));

    const moods = result.Items.map(item => ({
      timestamp: item.data.timestamp,
      valenceScore: item.data.valenceScore,
      arousalScore: item.data.arousalScore,
      emotionalScore: item.data.emotionalScore,
      contextTags: item.data.contextTags,
      stressScore: item.data.stressScore,
      sleepQuality: item.data.sleepQuality,
      energyLevel: item.data.energyLevel,
      diaryText: item.data.diaryText
    }));

    return response(200, { moods });

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