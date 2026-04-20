import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";
const JWT_SECRET = process.env.JWT_SECRET;

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

    if (result.Items.length === 0) {
      return response(401, { error: "Email ou senha inválidos" });
    }

    const user = result.Items[0];

    // Valida senha
    const validPassword = await bcrypt.compare(password, user.data.passwordHash);
    if (!validPassword) {
      return response(401, { error: "Email ou senha inválidos" });
    }

    // Extrai id e tipo do usuário
    const userType = user.type; // CLINICIAN ou PATIENT
    const userId = user.PK.split("#")[1];

    // Gera JWT
    const token = jwt.sign(
      {
        id: userId,
        type: userType,
        email: user.data.email
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return response(200, {
      token,
      user: {
        id: userId,
        name: user.data.name,
        email: user.data.email,
        type: userType,
        ...(userType === "PATIENT" && { mustChangePassword: user.data.mustChangePassword })
      }
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
    "Access-Control-Allow-Origin": "*"
  },
  body: JSON.stringify(body)
});