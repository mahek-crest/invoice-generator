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
const multiline = (value: string) =>
  escape(value).replace(/\r\n|\r|\n/g, "<br>");
const labelStyle = "font-size:12px;line-height:18px;color:#53666e;";

function partyDetails(party: Invoice["customer"] | Invoice["business"]) {
  return [
    party.name,
    party.address,
    party.email,
    "phone" in party ? party.phone : "",
  ]
    .filter(Boolean)
    .map(multiline)
    .join("<br>");
}

function summaryRow(label: string, amount: number, total = false) {
  const style = total
    ? "padding:16px 0 0;border-top:2px solid #182d35;font-size:18px;font-weight:bold;"
    : "padding:6px 0;font-size:14px;";
  return `<tr><td style="${style}">${escape(label)}</td><td align="right" style="${style}white-space:nowrap;">${escape(formatCents(amount))}</td></tr>`;
}

export function emailTemplate(invoice: Invoice, message: string) {
  const totals = calculateTotals(invoice);
  const fields = invoice.customFields.filter((field) => !field.hidden);
  const text = [
    `Invoice ${invoice.invoiceNumber}`,
    "",
    message,
    "",
    "From",
    invoice.business.name,
    invoice.business.address,
    invoice.business.email,
    invoice.business.phone,
    "",
    "Bill to",
    invoice.customer.name,
    invoice.customer.address,
    invoice.customer.email,
    "",
    `Issued: ${formatDate(invoice.issueDate)}`,
    `Payment due: ${formatDate(invoice.dueDate)}`,
    ...fields.map((field) => `${field.label}: ${field.value}`),
    "",
    "Description | Quantity | Unit price | Amount",
    ...invoice.lineItems.map(
      (item, i) =>
        `${item.description} | ${item.quantity} | ${formatCents(item.unitPrice * 100)} | ${formatCents(totals.lineTotalsCents[i])}`,
    ),
    "",
    `Subtotal: ${formatCents(totals.subtotalCents)}`,
    `Discount: -${formatCents(totals.discountCents)}`,
    `Tax (${invoice.taxRate}%): ${formatCents(totals.taxCents)}`,
    `Total due (USD): ${formatCents(totals.grandTotalCents)}`,
    ...(invoice.notes ? ["", "Payment terms & notes", invoice.notes] : []),
  ].join("\n");

  // Email clients do not load the app's Tailwind stylesheet. Keep layout tables
  // presentational and inline every style needed to read the invoice.
  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>Invoice ${escape(invoice.invoiceNumber)}</title></head>
<body style="margin:0;padding:0;background-color:#e7ecec;color:#182d35;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background-color:#e7ecec;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;border-collapse:collapse;background-color:#fffef9;border:1px solid #ccd5d8;">
        <tr><td style="padding:28px 24px 20px;border-bottom:3px solid #182d35;">
          <p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:30px;">${escape(invoice.business.name || "Invoice")}</p>
          <h1 style="margin:0;font-size:20px;line-height:28px;overflow-wrap:anywhere;">Invoice ${escape(invoice.invoiceNumber)}</h1>
        </td></tr>
        <tr><td style="padding:20px 24px;background-color:#245c73;color:#ffffff;">
          <p style="margin:0 0 6px;font-size:13px;line-height:18px;">Total due (USD)</p>
          <p style="margin:0;font-size:30px;line-height:38px;font-weight:bold;">${escape(formatCents(totals.grandTotalCents))}</p>
          <p style="margin:8px 0 0;font-size:13px;line-height:20px;">Payment due: ${escape(formatDate(invoice.dueDate))}</p>
        </td></tr>
        ${message.trim() ? `<tr><td style="padding:20px 24px 0;font-size:14px;line-height:22px;overflow-wrap:anywhere;">${multiline(message)}</td></tr>` : ""}
        <tr><td style="padding:24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;">
            <tr>
              <td width="50%" valign="top" style="padding-right:12px;font-size:13px;line-height:21px;word-break:break-word;">
                <p style="margin:0 0 8px;${labelStyle}">From</p>${partyDetails(invoice.business)}
              </td>
              <td width="50%" valign="top" style="padding-left:12px;font-size:13px;line-height:21px;word-break:break-word;">
                <p style="margin:0 0 8px;${labelStyle}">Bill to</p>${partyDetails(invoice.customer)}
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;${labelStyle}">Issued: ${escape(formatDate(invoice.issueDate))}</p>
          ${fields.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:12px;">${fields.map((field) => `<tr><td valign="top" style="padding:4px 12px 4px 0;font-size:13px;line-height:20px;overflow-wrap:anywhere;">${escape(field.label)}</td><td valign="top" align="right" style="padding:4px 0;font-size:13px;line-height:20px;overflow-wrap:anywhere;">${multiline(field.value || "—")}</td></tr>`).join("")}</table>` : ""}
        </td></tr>
        <tr><td style="padding:0 24px;">
          <table aria-label="Invoice line items" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;font-size:12px;line-height:18px;">
            <thead><tr>
              <th scope="col" width="43%" align="left" style="padding:10px 8px 10px 0;border-bottom:2px solid #182d35;">Description</th>
              <th scope="col" width="11%" align="right" style="padding:10px 4px;border-bottom:2px solid #182d35;">Qty</th>
              <th scope="col" width="23%" align="right" style="padding:10px 4px;border-bottom:2px solid #182d35;">Rate</th>
              <th scope="col" width="23%" align="right" style="padding:10px 0 10px 4px;border-bottom:2px solid #182d35;">Amount</th>
            </tr></thead>
            <tbody>${invoice.lineItems
              .map(
                (item, i) => `<tr>
              <td valign="top" style="padding:12px 8px 12px 0;border-bottom:1px solid #ccd5d8;overflow-wrap:anywhere;">${multiline(item.description)}</td>
              <td valign="top" align="right" style="padding:12px 4px;border-bottom:1px solid #ccd5d8;overflow-wrap:anywhere;">${item.quantity}</td>
              <td valign="top" align="right" style="padding:12px 4px;border-bottom:1px solid #ccd5d8;overflow-wrap:anywhere;">${escape(formatCents(item.unitPrice * 100))}</td>
              <td valign="top" align="right" style="padding:12px 0 12px 4px;border-bottom:1px solid #ccd5d8;font-weight:bold;overflow-wrap:anywhere;">${escape(formatCents(totals.lineTotalsCents[i]))}</td>
            </tr>`,
              )
              .join("")}</tbody>
          </table>
        </td></tr>
        <tr><td style="padding:20px 24px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${summaryRow("Subtotal", totals.subtotalCents)}
            ${summaryRow("Discount", -totals.discountCents)}
            ${summaryRow(`Tax (${invoice.taxRate}%)`, totals.taxCents)}
            ${summaryRow("Total due (USD)", totals.grandTotalCents, true)}
          </table>
        </td></tr>
        ${invoice.notes ? `<tr><td style="padding:20px 24px;border-top:1px solid #ccd5d8;"><h2 style="margin:0 0 8px;font-size:13px;line-height:20px;">Payment terms &amp; notes</h2><p style="margin:0;font-size:13px;line-height:21px;overflow-wrap:anywhere;">${multiline(invoice.notes)}</p></td></tr>` : ""}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { text, html };
}
