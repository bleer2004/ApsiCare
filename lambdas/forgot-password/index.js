import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import nodemailer from "nodemailer";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { email } = body;

    if (!email) {
      return response(400, { error: "Email é obrigatório" });
    }

    // Verifica se email existe no GSI1
    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1PK-GSI1SK-index",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: {
        ":email": `EMAIL#${email}`
      }
    }));

    // Mesmo se não existir, retorna sucesso (segurança)
    if (result.Items.length === 0) {
      return response(200, { message: "Se o email existir, você receberá um código em breve" });
    }

    const user = result.Items[0];
    const userId = user.PK.split("#")[1];
    const userType = user.type;

    // Gera código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const ttl = Math.floor(Date.now() / 1000) + 3600; // 1 hora

    // Salva token no DynamoDB com TTL
    await dynamo.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `TOKEN#${code}`,
        SK: "RESET",
        userId,
        userType,
        email,
        ttl,
        used: false
      }
    }));

    // Envia email
    await transporter.sendMail({
      from: `"PsicoCare" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Código de redefinição de senha — PsicoCare",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
          <h2>Redefinição de senha</h2>
          <p>Seu código de verificação é:</p>
          <h1 style="letter-spacing: 8px; color: #6B4EFF;">${code}</h1>
          <p>Este código expira em <strong>1 hora</strong>.</p>
          <p>Se você não solicitou isso, ignore este email.</p>
        </div>
      `
    });

    return response(200, { message: "Se o email existir, você receberá um código em breve" });

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