import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;
    const body = JSON.parse(event.body);
    const { valenceScore, arousalScore, contextTags, stressScore, sleepQuality, energyLevel, diaryText } = body;

    if (!patientId || !valenceScore || !arousalScore) {
      return response(400, { error: "Campos obrigatórios: valenceScore, arousalScore" });
    }

    if (valenceScore < 1 || valenceScore > 9 || arousalScore < 1 || arousalScore > 9) {
      return response(400, { error: "valenceScore e arousalScore devem ser entre 1 e 9" });
    }

    // Calcula emotionalScore (0-100)
    const contextAdjustment = contextTags?.includes("trabalho") ? -5 :
                              contextTags?.includes("sono") ? -8 : 0;
    const emotionalScore = Math.round(
      ((valenceScore / 9) * 70 + (1 - arousalScore / 9) * 30) * 100 / 100 + contextAdjustment
    );

    const now = new Date().toISOString();

    const item = {
      PK: `PATIENT#${patientId}`,
      SK: `MOOD#${now}`,
      type: "MOOD",
      createdAt: now,
      data: {
        valenceScore,
        arousalScore,
        emotionalScore: Math.max(0, Math.min(100, emotionalScore)),
        contextTags: contextTags || [],
        contextAdjustment,
        stressScore: stressScore || null,
        sleepQuality: sleepQuality || null,
        energyLevel: energyLevel || null,
        diaryText: diaryText || null,
        timestamp: now
      }
    };

    await dynamo.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    return response(201, {
      timestamp: now,
      emotionalScore: item.data.emotionalScore,
      valenceScore,
      arousalScore
    });

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