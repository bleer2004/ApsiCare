import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;
    const body = JSON.parse(event.body);
    const {
      bvp, eda, skinTemp, accX, accY, accZ,
      heartRate, hrv, sleepDuration, steps,
      source, measuredAt
    } = body;

    if (!patientId || !measuredAt) {
      return response(400, { error: "patientId e measuredAt são obrigatórios" });
    }

    const now = new Date().toISOString();

    const item = {
      PK: `PATIENT#${patientId}`,
      SK: `PHYSIO#${measuredAt}`,
      type: "PHYSIO",
      createdAt: now,
      data: {
        bvp: bvp || null,
        eda: eda || null,
        skinTemp: skinTemp || null,
        accX: accX || null,
        accY: accY || null,
        accZ: accZ || null,
        heartRate: heartRate || null,
        hrv: hrv || null,
        sleepDuration: sleepDuration || null,
        steps: steps || null,
        source: source || "manual",
        measuredAt,
        createdAt: now
      }
    };

    await dynamo.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    return response(201, { message: "Dados fisiológicos registrados!", measuredAt });

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