import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ApsiCare";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return response(400, { error: "E-mail e senha são obrigatórios." });
    }

    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1PK-GSI1SK-index",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: { ":email": `EMAIL#${email}` }
    }));

    if (!result.Items || result.Items.length === 0) {
      return response(401, { error: "E-mail ou senha incorretos." });
    }

    // Garante que só lê o CLINICIAN — ignora paciente com mesmo email
    const user = result.Items.find(item => item.PK.startsWith("CLINICIAN#"));

    if (!user) {
      return response(401, { error: "E-mail ou senha incorretos." });
    }

    const hashLegado = /^[a-f0-9]{64}$/.test(user.passwordHash || "");
    const senhaValida = hashLegado
      ? createHash("sha256").update(password).digest("hex") === user.passwordHash
      : await bcrypt.compare(password, user.passwordHash || "");
    if (!senhaValida) {
      return response(401, { error: "E-mail ou senha incorretos." });
    }

    if (hashLegado) {
      await dynamo.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: user.PK, SK: user.SK },
        UpdateExpression: "SET passwordHash = :hash",
        ExpressionAttributeValues: { ":hash": await bcrypt.hash(password, 8) }
      }));
    }

    const userId = user.PK.split("#")[1];

    const token = jwt.sign(
      { id: userId, email: user.email, type: "CLINICIAN" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return response(200, {
      token,
      user: { id: userId, name: user.name, email: user.email, type: "CLINICIAN" }
    });

  } catch (err) {
    console.error("ERRO_NO_LOGIN:", err);
    return response(500, { error: "Erro interno no servidor." });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body)
});