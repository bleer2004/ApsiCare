import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const patientId = event.pathParameters?.patientId;
  if (!patientId) return resp(400, { error: "patientId obrigatório" });

  try {
    const result = await dynamo.send(new QueryCommand({
      TableName: "ApsiCare",
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": `PATIENT#${patientId}`,
        ":prefix": "EMERGENCY_CONTACT#",
      },
    }));

    console.log("Items encontrados:", result.Items?.length);
    console.log("Items:", JSON.stringify(result.Items));

    const contacts = (result.Items || []).map((item) => ({
      contactId: item.contactId,
      nome: item.nome,
      telefone: item.telefone,
      relacao: item.relacao,
      createdAt: item.createdAt,
    }));

    return resp(200, { contacts });
  } catch (err) {
    console.error("Erro DynamoDB:", err);
    return resp(500, { error: "Erro ao buscar contatos de emergência", detail: err.message });
  }
};

const resp = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body),
});