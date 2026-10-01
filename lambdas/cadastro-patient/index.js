import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, GetIdentityVerificationAttributesCommand, VerifyEmailIdentityCommand } from "@aws-sdk/client-ses";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ApsiCare";
const ses = new SESClient({ region: "sa-east-1" });

// SES em sandbox só entrega para e-mails verificados: pede a verificação (a AWS manda um e-mail com link)
// e informa o status. Sem permissão de IAM, devolve "sem_permissao" e o fluxo segue como antes.
async function statusVerificacaoEmail(ses, email) {
  try {
    const r = await ses.send(new GetIdentityVerificationAttributesCommand({ Identities: [email] }));
    const status = r.VerificationAttributes?.[email]?.VerificationStatus;
    if (status === "Success") return "verificado";
    await ses.send(new VerifyEmailIdentityCommand({ EmailAddress: email }));
    return "pendente";
  } catch (err) {
    console.error("[ses] não foi possível checar/pedir verificação do e-mail:", err.name, err.message);
    return "sem_permissao";
  }
}

export const handler = async (event) => {
  try {
    const clinicianId = event.pathParameters?.clinicianId;
    const body = JSON.parse(event.body);
    const { name, email, phone, birthDate, diagnostico, observacoes, configuracoesApp, configuracoesIA } = body;

    if (!clinicianId || !name || !email) {
      return response(400, { error: "Campos obrigatórios: name, email" });
    }

    const clinician = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `CLINICIAN#${clinicianId}`, SK: "PROFILE" }
    }));

    if (!clinician.Item) {
      return response(404, { error: "Psicólogo não encontrado" });
    }

    const existing = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1PK-GSI1SK-index",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: { ":email": `EMAIL#${email.trim().toLowerCase()}` }
    }));

    // Só bloqueia se já existir como PATIENT
    const jaExisteComoPatient = existing.Items?.some(item => item.PK.startsWith("PATIENT#"));
    if (jaExisteComoPatient) {
      return response(409, { error: "Email já cadastrado como paciente" });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 8); // cost 8 — sem timeout
    const id = uuidv4();
    const now = new Date().toISOString();

    const patientItem = {
      PK: `PATIENT#${id}`,
      SK: `PATIENT#${id}`,
      GSI1PK: `EMAIL#${email.trim().toLowerCase()}`,
      GSI1SK: `PATIENT#${id}`,
      type: "PATIENT",
      clinicianId,
      name,
      email: email.trim().toLowerCase(),
      phone: phone || null,
      birthDate: birthDate || null,
      passwordHash,
      tempPassword,
      mustChangePassword: true,
      isActive: true,
      xpPoints: 0,
      level: 1,
      streakDays: 0,
      diagnostico: diagnostico || null,
      observacoes: observacoes || null,
      configuracoesApp: configuracoesApp || null,
      configuracoesIA: configuracoesIA || null,
      createdAt: now,
    };

    const linkItem = {
      PK: `CLINICIAN#${clinicianId}`,
      SK: `PATIENT#${id}`,
      type: "PATIENT_LINK",
      patientId: id,
      name,
      email: email.trim().toLowerCase(),
      phone: phone || null,
      birthDate: birthDate || null,
      diagnostico: diagnostico || null,
      observacoes: observacoes || null,
      isActive: true,
      createdAt: now,
    };

    await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: patientItem }));
    await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: linkItem }));

    const emailVerificacao = await statusVerificacaoEmail(ses, email.trim().toLowerCase());

    return response(201, { patient: { id, name, email, diagnostico: diagnostico || null, createdAt: now }, emailVerificacao });

  } catch (err) {
    console.error(err);
    return response(500, { error: "Erro interno do servidor" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body)
});