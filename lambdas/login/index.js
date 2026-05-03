import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    // Limpeza básica dos inputs
    const email = body.email ? body.email.trim().toLowerCase() : null;
    const password = body.password ? body.password : null;

    if (!email || !password) {
      return response(400, { error: "E-mail e senha são obrigatórios." });
    }

    console.log(`Tentativa de login para: EMAIL#${email}`);

    // 1. Busca o usuário pelo email usando o GSI
    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1PK-GSI1SK-index",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: {
        ":email": `EMAIL#${email}`
      }
    }));

    if (!result.Items || result.Items.length === 0) {
      console.log(result.Items);
      console.log("Usuário não encontrado no GSI1PK");
      return response(401, { error: "E-mail ou senha incorretos." });
    }

    const user = result.Items[0];
    const hashNoBanco = user.passwordHash;

    // 2. Valida a senha usando SHA-256 (Padrão que o seu banco já possui)
    const loginPasswordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    console.log("Comparando hashes...");
    if (loginPasswordHash !== hashNoBanco) {
      console.log("Senha não confere.");
      return response(401, { error: "E-mail ou senha incorretos." });
    }

    // 3. Extrai o ID real do usuário (Removendo o prefixo CLINICIAN#)
    const userId = user.PK.split("#")[1];

    console.log("Login bem-sucedido para o ID:", userId);

    return response(200, {
      message: "Login realizado com sucesso",
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        type: user.type || "CLINICIAN"
      }
    });

  } catch (err) {
    console.error("ERRO_NO_LOGIN:", err);
    return response(500, { error: "Erro interno no servidor de autenticação." });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  },
  body: JSON.stringify(body)
});