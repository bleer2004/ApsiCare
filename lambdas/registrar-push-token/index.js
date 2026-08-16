import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "ApsiCare";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { userId, userType, pushToken } = body;

    if (!userId || !userType || !pushToken) {
      return response(400, { error: "userId, userType e pushToken são obrigatórios" });
    }
    if (userType !== "patient" && userType !== "clinician") {
      return response(400, { error: "userType deve ser 'patient' ou 'clinician'" });
    }

    const key = userType === "patient"
      ? { PK: `PATIENT#${userId}`, SK: `PATIENT#${userId}` }
      : { PK: `CLINICIAN#${userId}`, SK: "PROFILE" };

    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: key,
      UpdateExpression: "SET pushToken = :pushToken, pushTokenUpdatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":pushToken": pushToken,
        ":updatedAt": new Date().toISOString(),
      },
    }));

    return response(200, { message: "Token registrado com sucesso" });
  } catch (err) {
    console.error("ERRO registrar-push-token:", err);
    return response(500, { error: "Erro interno" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body),
});
