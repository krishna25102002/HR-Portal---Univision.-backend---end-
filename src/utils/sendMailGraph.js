import axios from "axios";
import { getGraphAccessToken } from "./msGraphAuth.js";

export const sendMailViaGraph = async ({ to, subject, html }) => {
  const token = await getGraphAccessToken();

  const url = `https://graph.microsoft.com/v1.0/users/${process.env.MS_MAIL_SENDER}/sendMail`;

  const payload = {
    message: {
      subject,
      body: {
        contentType: "HTML",
        content: html,
      },
      toRecipients: [
        {
          emailAddress: { address: to },
        },
      ],
    },
    saveToSentItems: true,
  };

  await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};
