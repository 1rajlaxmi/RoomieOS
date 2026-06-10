import nodemailer from "nodemailer";

// 1. Define the exact shape of our email data using a TypeScript Interface
interface EmailOptions {
  to: string;
  subject: string;
  title: string;
  body: string;
  ctaText?: string; // Optional (denoted by '?')
  ctaLink?: string; // Optional (denoted by '?')
}

// 2. Configure the email engine
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Reusable utility to send beautifully formatted emails
 */
const sendEmail = async ({ to, subject, title, body, ctaText, ctaLink }: EmailOptions): Promise<void> => {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%); padding: 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -1px; }
        .content { padding: 40px; text-align: center; }
        .content h2 { font-size: 20px; font-weight: 700; color: #1e293b; margin-top: 0; }
        .content p { font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 32px; }
        .btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; padding: 14px 28px; font-weight: 700; font-size: 14px; border-radius: 12px; transition: all 0.2s; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>RoomieOS</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          <p>${body}</p>
          ${ctaText && ctaLink ? `<a href="${ctaLink}" class="btn">${ctaText}</a>` : ""}
        </div>
        <div class="footer">
          Sent automatically by RoomieOS • Keep your apartment running smoothly.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"RoomieOS" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlTemplate,
    });
    console.log(`Email successfully sent to ${to}`);
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
};

export default sendEmail;