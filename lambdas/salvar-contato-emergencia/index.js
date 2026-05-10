import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;
    const { name, phone } = JSON.parse(event.body);

    if (!patientId || !name || !phone) {
      return response(400, { error: "patientId, name e phone são obrigatórios" });
    }

    // Verifica se paciente existe
    const existing = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `PATIENT#${patientId}`,
        SK: `PATIENT#${patientId}`
      }
    }));

    if (!existing.Item) {
      return response(404, { error: "Paciente não encontrado" });
    }

    // Salva contato de emergência
    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `PATIENT#${patientId}`,
        SK: `PATIENT#${patientId}`
      },
      UpdateExpression: "SET emergencyContact = :contact, updatedAt = :now",
      ExpressionAttributeValues: {
        ":contact": { name, phone },
        ":now": new Date().toISOString()
      }
    }));

    return response(200, { message: "Contato de emergência salvo com sucesso!", contact: { name, phone } });

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