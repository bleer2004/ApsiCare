import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ApsiCare";

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;
    const moodId = event.pathParameters?.moodId;

    if (!patientId || !moodId) {
      return response(400, { error: "patientId e moodId são obrigatórios" });
    }

    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `PATIENT#${patientId}`,
        SK: `MOOD#${moodId}`,
      },
      UpdateExpression: "SET #data.sharedWithPsychologist = :val",
      ExpressionAttributeNames: { "#data": "data" },
      ExpressionAttributeValues: { ":val": true },
    }));

    return response(200, { message: "Anotação compartilhada com sucesso" });

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
