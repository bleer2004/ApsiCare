import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand, GetIdentityVerificationAttributesCommand, VerifyEmailIdentityCommand } from "@aws-sdk/client-ses";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const ses = new SESClient({ region: "sa-east-1" });
const TABLE_NAME = "ApsiCare";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

    if ((await statusVerificacaoEmail(ses, patient.email)) === "pendente") {
      return response(409, { error: "O paciente ainda não confirmou o e-mail. A Amazon Web Services enviou um e-mail (em inglês, assunto \"Amazon Web Services – Email Address Verification Request\") para confirmar este endereço. Peça para ele clicar no link desse e-mail e depois envie o convite de novo. Confira também o spam.", verificacaoPendente: true });
    }

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