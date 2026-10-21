import "server-only";
import type { Invoice } from "@/lib/schemas";
import { calculateTotals } from "@/lib/totals";
import { formatCents, formatDate } from "@/lib/format";

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
export function emailTemplate(invoice: Invoice, message: string) {
  const totals = calculateTotals(invoice);
  const lines = invoice.lineItems.map(
    (item, i) =>
      `${item.description} | ${item.quantity} × ${formatCents(item.unitPrice * 100)} | ${formatCents(totals.lineTotalsCents[i])}`,
  );
  const fields = invoice.customFields
    .filter((field) => !field.hidden)
    .map((field) => `${field.label}: ${field.value}`);
  const text = [
    invoice.business.name,
    `Invoice ${invoice.invoiceNumber}`,
    `For ${invoice.customer.name}`,
    `Due ${formatDate(invoice.dueDate)}`,
    message,
    ...lines,
    `Subtotal: ${formatCents(totals.subtotalCents)}`,
    `Discount: ${formatCents(totals.discountCents)}`,
    `Tax (${invoice.taxRate}%): ${formatCents(totals.taxCents)}`,
    `Total due: ${formatCents(totals.grandTotalCents)}`,
    ...fields,
    invoice.notes,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;color:#182d35;max-width:640px;margin:auto"><h1>${escape(invoice.business.name)}</h1><h2>Invoice ${escape(invoice.invoiceNumber)}</h2><p>For ${escape(invoice.customer.name)} · Due ${escape(formatDate(invoice.dueDate))}</p><p style="white-space:pre-wrap">${escape(message)}</p><table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Description</th><th>Quantity</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${invoice.lineItems.map((item, i) => `<tr><td style="padding:12px 0;border-bottom:1px solid #ddd">${escape(item.description)}</td><td align="center">${item.quantity}</td><td align="right">${formatCents(item.unitPrice * 100)}</td><td align="right">${formatCents(totals.lineTotalsCents[i])}</td></tr>`).join("")}</tbody></table><p>Subtotal: ${formatCents(totals.subtotalCents)}<br>Discount: ${formatCents(totals.discountCents)}<br>Tax (${invoice.taxRate}%): ${formatCents(totals.taxCents)}</p><h2>Total due: ${formatCents(totals.grandTotalCents)}</h2>${fields.map((field) => `<p>${escape(field)}</p>`).join("")}<p style="white-space:pre-wrap">${escape(invoice.notes)}</p></div>`;
  return { text, html };
}
