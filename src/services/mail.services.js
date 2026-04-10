const nodemailer = require("nodemailer");
const { StatusCodes } = require("http-status-codes");
const env = require("../configs/environments");
const AppError = require("../utils/AppError");

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new AppError(
      "SMTP configuration is missing",
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  const mailer = getTransporter();

  return mailer.sendMail({
    from: env.SMTP_FROM || env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
};

const sendVerificationCodeMail = async ({ email, code }) => {
  return sendMail({
    to: email,
    subject: "Xac thuc email dang ky tai khoan",
    text: `Ma xac thuc dang ky cua ban la ${code}. Ma co hieu luc trong 10 phut.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2 style="margin-bottom:12px">Xac thuc email dang ky tai khoan</h2>
        <p>Ma xac thuc cua ban la:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</div>
        <p>Ma co hieu luc trong 10 phut.</p>
      </div>
    `,
  });
};

const sendResetPasswordCodeMail = async ({ email, code }) => {
  return sendMail({
    to: email,
    subject: "Dat lai mat khau tai khoan",
    text: `Ma dat lai mat khau cua ban la ${code}. Ma co hieu luc trong 10 phut.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2 style="margin-bottom:12px">Dat lai mat khau tai khoan</h2>
        <p>Ma dat lai mat khau cua ban la:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</div>
        <p>Ma co hieu luc trong 10 phut.</p>
      </div>
    `,
  });
};

module.exports = {
  sendMail,
  sendVerificationCodeMail,
  sendResetPasswordCodeMail,
};
