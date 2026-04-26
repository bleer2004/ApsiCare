import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { email, password } = body;

    if (!email || !password) {
      return response(400, { error: "Email e senha são obrigatórios" });
    }

    // Busca usuário pelo email no GSI1
    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1PK-GSI1SK-index",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: {
        ":email": `EMAIL#${email}`
      }
    }));

    if (!result.Items || result.Items.length === 0) {
      return response(401, { error: "Email ou senha inválidos" });
    }

    const user = result.Items[0];

    // Valida senha usando SHA-256 (Igual ao seu cadastro)
    const loginPasswordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    if (loginPasswordHash !== user.data.passwordHash) {
      return response(401, { error: "Email ou senha inválidos" });
    }

    // Extrai id
    const userId = user.PK.split("#")[1];

    return response(200, {
      message: "Login realizado com sucesso",
      user: {
        id: userId,
        name: user.data.name,
        email: user.data.email,
        type: user.type
      }
    });

  } catch (err) {
    console.error("Erro no login:", err);
    return response(500, { error: err.message });
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