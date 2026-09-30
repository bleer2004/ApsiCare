import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ApsiCare";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { name, email, password, phone, cellphone, councilId, profession, birthDate, termsAccepted } = body;

    if (!name || !email || !password || !councilId) {
      return response(400, { error: "Campos obrigatórios: name, email, password, councilId" });
    }

    const existing = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1PK-GSI1SK-index",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: { ":email": `EMAIL#${email.trim().toLowerCase()}` }
    }));

    // Só bloqueia se já existir como CLINICIAN
    const jaExisteComoClinico = existing.Items?.some(item => item.PK.startsWith("CLINICIAN#"));
    if (jaExisteComoClinico) {
      return response(409, { error: "Email já cadastrado como psicólogo" });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 8);

    const item = {
      PK: `CLINICIAN#${id}`,
      SK: "PROFILE",
      GSI1PK: `EMAIL#${email.trim().toLowerCase()}`,
      GSI1SK: "PROFILE",
      id,
      type: "CLINICIAN",
      name,
      email: email.trim().toLowerCase(),
      phone: phone || null,
      cellphone: cellphone || null,
      councilId,
      profession: profession || null,
      birthDate: birthDate || null,
      passwordHash,
      isActive: true,
      isAdmin: false,
      termsAcceptedAt: termsAccepted === true ? now : null,
      createdAt: now,
      updatedAt: now
    };

    await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

    return response(201, { id, name, email, councilId, createdAt: now });

  } catch (err) {
    console.error("ERRO:", err);
    return response(500, { error: "Erro interno do servidor" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body)
});