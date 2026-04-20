import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
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
    const clinicianId = event.pathParameters?.clinicianId;
    const body = JSON.parse(event.body);
    const { name, email, phone, birthDate } = body;

    if (!clinicianId || !name || !email) {
      return response(400, { error: "Campos obrigatórios: name, email" });
    }

    // Verifica se o psicólogo existe
    const clinician = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CLINICIAN#${clinicianId}`,
        SK: "PROFILE"
      }
    }));

    if (!clinician.Item) {
      return response(404, { error: "Psicólogo não encontrado" });
    }

    // Verifica se email já existe
    const existing = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1PK-GSI1SK-index",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: {
        ":email": `EMAIL#${email}`
      }
    }));

    if (existing.Items.length > 0) {
      return response(409, { error: "Email já cadastrado" });
    }

    // Gera senha temporária
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const id = uuidv4();
    const now = new Date().toISOString();

    const item = {
      PK: `CLINICIAN#${clinicianId}`,
      SK: `PATIENT#${id}`,
      GSI1PK: `EMAIL#${email}`,
      GSI1SK: `PATIENT#${id}`,
      type: "PATIENT",
      createdAt: now,
      data: {
        name,
        email,
        phone: phone || null,
        birthDate: birthDate || null,
        passwordHash,
        mustChangePassword: true,
        isActive: true,
        xpPoints: 0,
        level: 1,
        streakDays: 0,
        createdAt: now
      }
    };

    await dynamo.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    // Envia email com credenciais
    await transporter.sendMail({
      from: `"PsicoCare" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Seu acesso ao PsicoCare",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
          <h2>Bem-vindo(a) ao PsicoCare, ${name}!</h2>
          <p>Seu psicólogo criou seu acesso. Use as credenciais abaixo para entrar:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Senha temporária:</strong> ${tempPassword}</p>
          <p style="color: #e53e3e;">Você será solicitado a trocar sua senha no primeiro acesso.</p>
        </div>
      `
    });

    return response(201, {
      id,
      name,
      email,
      createdAt: now
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