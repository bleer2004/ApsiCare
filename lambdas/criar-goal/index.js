import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;
    const body = JSON.parse(event.body);
    const { title, category, xpReward } = body;

    if (!patientId || !title || !category) {
      return response(400, { error: "Campos obrigatórios: title, category" });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const item = {
      PK: `PATIENT#${patientId}`,
      SK: `GOAL#${id}`,
      type: "GOAL",
      createdAt: now,
      data: {
        title,
        category,
        status: "active",
        progress: 0,
        streakDays: 0,
        xpReward: xpReward || 20,
        createdBy: "clinician",
        completedAt: null
      }
    };

    await dynamo.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    return response(201, { id, title, category, status: "active", createdAt: now });

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