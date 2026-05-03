import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { name, email, password, phone, cellphone, councilId, profession, birthDate } = body;

    // Validação básica
    if (!name || !email || !password || !councilId) {
      return response(400, { error: "Campos obrigatórios: name, email, password, councilId" });
    }

    // Verifica se email já existe no GSI1
    const existing = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1PK-GSI1SK-index",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: {
        ":email": `EMAIL#${email}`
      }
    }));

    if (existing.Items && existing.Items.length > 0) {
        return response(409, { error: "Email já cadastrado" });
    }
    
    // Cria o psicólogo
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

      const item = {
      PK: `CLINICIAN#${id}`,
      SK: "PROFILE",
      GSI1PK: `EMAIL#${email.trim().toLowerCase()}`, 
      GSI1SK: "PROFILE", 
      id: id,           
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
      createdAt: now,
      updatedAt: now
    };

    await dynamo.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    return response(201, {
      id,
      name,
      email,
      councilId,
      createdAt: now
    });

  } catch (err) {
      console.error("LAMBDA ERROR COMPLETO:");
      console.error(err);
      
      return response(500, {
        error: err.message,
        stack: err.stack
      });
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