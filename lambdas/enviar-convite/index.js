import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const ses = new SESClient({ region: "sa-east-1" });
const TABLE_NAME = "ApsiCare";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;

    if (!patientId) {
      return response(400, { error: "patientId é obrigatório" });
    }

    const patientResult = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `PATIENT#${patientId}`,
        SK: `PATIENT#${patientId}`
      }
    }));

    if (!patientResult.Item) {
      return response(404, { error: "Paciente não encontrado" });
    }

    const patient = patientResult.Item;

    if (!patient.mustChangePassword || !patient.tempPassword) {
      return response(409, { error: "Este paciente já criou a própria senha. Peça para ele usar \"Esqueci minha senha\" no app." });
    }

    // Busca nome do psicólogo
    const clinicianResult = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CLINICIAN#${patient.clinicianId}`,
        SK: "PROFILE"
      }
    }));

    const clinicianName = clinicianResult.Item?.name || 'Seu psicólogo';

    let htmlTemplate = readFileSync(join(__dirname, 'conviteUsuario.html'), 'utf-8');
    htmlTemplate = htmlTemplate
      .replace(/\{\{nome\}\}/g, patient.name)
      .replace(/\{\{email\}\}/g, patient.email)
      .replace(/\{\{senha\}\}/g, patient.tempPassword)
      .replace(/\{\{psicologo\}\}/g, clinicianName)
      .replace(/\{\{link\}\}/g, '#');

    await ses.send(new SendEmailCommand({
      Source: process.env.SENDER_EMAIL,
      Destination: { ToAddresses: [patient.email] },
      Message: {
        Subject: { Data: "Seu acesso ao ApsiCare 🎉" },
        Body: { Html: { Data: htmlTemplate } }
      }
    }));

    return response(200, { message: "Convite enviado com sucesso!" });

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