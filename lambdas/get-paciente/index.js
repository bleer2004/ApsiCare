import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ApsiCare";

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.id;

    if (!patientId) {
      return response(400, { error: "id é obrigatório" });
    }

    const result = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `PATIENT#${patientId}`, SK: `PATIENT#${patientId}` },
    }));

    if (!result.Item) {
      return response(404, { error: "Paciente não encontrado" });
    }

    const item = result.Item;

    return response(200, {
      id: patientId,
      name: item.name,
      email: item.email,
      phone: item.phone || null,
      birthDate: item.birthDate || null,
      diagnostico: item.diagnostico || null,
      observacoes: item.observacoes || null,
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
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});
