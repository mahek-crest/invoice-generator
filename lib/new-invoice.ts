import type { InvoiceDraft } from "./schemas";
import { createSampleInvoice } from "./sample-invoice";

export function createBlankInvoice(): InvoiceDraft {
  const sample = createSampleInvoice();
  const today = new Date();
  const date = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  return {
    ...sample,
    invoiceNumber: `QQ-${today.getTime().toString().slice(-6)}`,
    issueDate: date,
    dueDate: date,
    customer: { name: "", email: "", address: "" },
    lineItems: [],
    customFields: [],
    discount: 0,
    taxRate: 0,
    notes: "Payment is due on receipt.",
  };
}
