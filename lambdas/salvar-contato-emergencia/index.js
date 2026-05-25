import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const patientId = event.pathParameters?.patientId;
  if (!patientId) return resp(400, { error: "patientId obrigatório" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return resp(400, { error: "Body inválido" });
  }

  const { nome, telefone, relacao } = body;
  if (!nome || !telefone) {
    return resp(400, { error: "nome e telefone são obrigatórios" });
  }

  const contactId = uuidv4();

  try {
    await dynamo.send(new PutCommand({
      TableName: "ApsiCare",
      Item: {
        PK: `PATIENT#${patientId}`,
        SK: `EMERGENCY_CONTACT#${contactId}`,
        type: "EMERGENCY_CONTACT",
        contactId,
        nome,
        telefone,
        relacao: relacao || "Não informado",
        createdAt: new Date().toISOString(),
      },
    }));

    return resp(201, {
      message: "Contato de emergência salvo com sucesso",
      contact: { contactId, nome, telefone, relacao: relacao || "Não informado" },
    });
  } catch (err) {
    console.error(err);
    return resp(500, { error: "Erro ao salvar contato de emergência" });
  }
};

const resp = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body),
});