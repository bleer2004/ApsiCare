import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand, GetIdentityVerificationAttributesCommand, VerifyEmailIdentityCommand } from "@aws-sdk/client-ses";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const ses = new SESClient({ region: "sa-east-1" });

const TABLE = "ApsiCare";
const FROM = "apsicare.noreply@gmail.com";

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
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return resp(400, { error: "Body inválido" });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) return resp(400, { error: "email é obrigatório" });

  try {
    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE,
      IndexName: "GSI1PK-GSI1SK-index",
      KeyConditionExpression: "GSI1PK = :gsi1pk",
      ExpressionAttributeValues: {
        ":gsi1pk": `EMAIL#${email}`
      }
    }));

    const paciente = (result.Items || []).find(item => item.type === "PATIENT");

    if (!paciente) {
      return resp(200, { message: "Se o e-mail estiver cadastrado, você receberá um código." });
    }

    if ((await statusVerificacaoEmail(ses, email)) === "pendente") {
      return resp(409, { error: "A Amazon Web Services enviou um e-mail (em inglês, assunto \"Amazon Web Services – Email Address Verification Request\") para confirmar este endereço. Clique no link desse e-mail e tente de novo. Confira também o spam.", verificacaoPendente: true });
    }

    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await dynamo.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK: paciente.PK, SK: paciente.SK },
      UpdateExpression: "SET resetCode = :code, resetCodeExpires = :expires",
      ExpressionAttributeValues: {
        ":code": codigo,
        ":expires": expiresAt
      }
    }));

    const templatePath = join(__dirname, "criarSenha.html");
    let htmlTemplate = readFileSync(templatePath, "utf-8");

    htmlTemplate = htmlTemplate
      .replace(/\$\{email\}/g, email)
      .replace(/\$\{codigo\}/g, codigo);

    await ses.send(new SendEmailCommand({
      Source: FROM,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "ApsiCare — Código de verificação" },
        Body: { Html: { Data: htmlTemplate } }
      }
    }));

    return resp(200, { message: "Se o e-mail estiver cadastrado, você receberá um código." });

  } catch (err) {
    console.error(err);
    return resp(500, { error: "Erro interno ao processar solicitação" });
  }
};

const resp = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body)
});