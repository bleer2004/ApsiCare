import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const dynamoClient = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({ region: "sa-east-1" });

const TABLE_NAME = "PsicoCare";
const SENDER_EMAIL = "psicocare.noreply@gmail.com"; 

export const handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body);

    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1PK-GSI1SK-index",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: { ":email": `EMAIL#${email}` }
    }));

    if (!result.Items || result.Items.length === 0) {
      return response(200, { message: "Se o e-mail existir, você receberá um código." });
    }

    const user = result.Items[0];
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const ttl = Math.floor(Date.now() / 1000) + 3600;

    // Salva o Token com informações extras para facilitar o reset depois
    await dynamo.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `TOKEN#${code}`,
        SK: "RESET",
        userId: user.PK.split("#")[1],
        userType: user.PK.split("#")[0], // CLINICIAN ou PATIENT
        email,
        ttl,
        used: false
      }
    }));

    // Envio via SES
    const sesParams = {
      Source: SENDER_EMAIL,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "Código de Verificação - PsicoCare" },
        Body: {
          Html: {
            Data: `<h1>Seu código é ${code}</h1><p>Válido por 1 hora.</p>`
          }
        }
      }
    };

    await sesClient.send(new SendEmailCommand(sesParams));

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