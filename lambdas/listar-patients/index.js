import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

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
        ":prefix": "PATIENT#"
      }
    }));

    const patients = result.Items.map(item => ({
      id: item.SK.split("#")[1],
      name: item.data.name,
      email: item.data.email,
      phone: item.data.phone,
      birthDate: item.data.birthDate,
      isActive: item.data.isActive,
      xpPoints: item.data.xpPoints,
      level: item.data.level,
      streakDays: item.data.streakDays,
      createdAt: item.createdAt
    }));

    return response(200, { patients });

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