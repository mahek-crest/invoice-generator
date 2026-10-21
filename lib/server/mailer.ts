import "server-only";
import nodemailer from "nodemailer";
import type { Invoice, SendInvoiceInput } from "@/lib/schemas";
import { emailTemplate } from "./email-template";

export function emailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.MAIL_FROM,
  );
}
export async function sendInvoice(invoice: Invoice, input: SendInvoiceInput) {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,
    socketTimeout: 20000,
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to: input.to,
    subject:
      input.subject ||
      `Invoice ${invoice.invoiceNumber} from ${invoice.business.name}`,
    ...emailTemplate(invoice, input.message),
  });
}
