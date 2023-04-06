import nodemailer from "nodemailer";
import { google } from "googleapis";
import * as dotenv from 'dotenv'
dotenv.config()
const {
    DB,
    GOOGLE_API_EMAIL,
    GOOGLE_API_CLIENT_ID,
    GOOGLE_API_SECRET,
    GOOGLE_API_GMAIL_REFRESH_TOKEN,
    GOOGLE_API_REDIRECT,
    NODE_ENV,
    ETHEREAL_EMAIL,
    ETHEREAL_PASS
} = process.env;

const isDev = NODE_ENV !== 'production' ? true : false;

const oAuth2Client = new google.auth.OAuth2(GOOGLE_API_CLIENT_ID, GOOGLE_API_SECRET, GOOGLE_API_REDIRECT);
oAuth2Client.setCredentials({ refresh_token: GOOGLE_API_GMAIL_REFRESH_TOKEN })

export default async function sendMail({ to = '', subject = '', text = '', html = '' }) {
    if (!to) return Promise.reject("recipient is required")
    if (!subject) return Promise.reject("subject is required")
    if (!text) return Promise.reject("text is required")

    try {

        let mailOptions = {
            from: `${DB} <${GOOGLE_API_EMAIL}>`,
            to,
            subject,
            text,
            html
        }

        let result;

        if (!isDev) {
            const accessToken = await oAuth2Client.getAccessToken()

            const transport = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    type: 'OAuth2',
                    user: GOOGLE_API_EMAIL,
                    clientId: GOOGLE_API_CLIENT_ID,
                    clientSecret: GOOGLE_API_SECRET,
                    refreshToken: GOOGLE_API_GMAIL_REFRESH_TOKEN,
                    accessToken: accessToken
                }
            })
            result = await transport.sendMail(mailOptions)
        }

        if (isDev) {
            let transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                auth: {
                    user: ETHEREAL_EMAIL,
                    pass: ETHEREAL_PASS
                }
            });
            result = await transporter.sendMail(mailOptions)
        }

        return result;
    } catch (error) {
        console.log(error, 'mailer');
        return error
    }
}