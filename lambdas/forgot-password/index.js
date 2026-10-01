import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const dynamoClient = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: "sa-east-1" });
const TABLE_NAME = "ApsiCare";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const handler = async (event) => {
  try {
    const email = JSON.parse(event.body || "{}").email?.trim().toLowerCase();
    if (!email) {
      return response(400, { error: "E-mail é obrigatório" });
    }

    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1PK-GSI1SK-index",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: { ":email": `EMAIL#${email}` }
    }));

    const user = (result.Items || []).find(item => item.PK.startsWith("CLINICIAN#"));
    if (!user) {
      return response(200, { message: "Se o e-mail existir, você receberá um código." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const ttl = Math.floor(Date.now() / 1000) + 3600;

    await dynamo.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `TOKEN#${code}`,
        SK: "RESET",
        userId: user.PK.split("#")[1],
        userType: user.PK.split("#")[0],
        email,
        ttl,
        used: false
      }
    }));

    const dataSolicitacao = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    let htmlTemplate = readFileSync(join(__dirname, 'recuperarSenha.html'), 'utf-8');
    htmlTemplate = htmlTemplate
      .replace(/\{\{email\}\}/g, email)
      .replace(/\{\{codigo\}\}/g, code)
      .replace(/\{\{data_solicitacao\}\}/g, dataSolicitacao)
      .replace(/\{\{ip\}\}/g, 'Não disponível')
      .replace(/\{\{validade\}\}/g, '60')
      .replace(/\{\{link_redefinir\}\}/g, '#')
      .replace(/\{\{link_login\}\}/g, '#');

    await sesClient.send(new SendEmailCommand({
      Source: process.env.SENDER_EMAIL,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "Código de Verificação - ApsiCare" },
        Body: { Html: { Data: htmlTemplate } }
      }
    }));

    return response(200, { message: "Código enviado!" });
  } catch (err) {
    console.error(err);
    return response(500, { error: "Erro ao processar solicitação" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
  body: JSON.stringify(body)
});