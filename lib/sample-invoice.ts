import type { InvoiceDraft } from "./schemas";

/**
 * Fictional throughout: made-up shop, made-up customer, @example.com addresses.
 * Loaded by the "Load sample invoice" action so the preview has something to show
 * on a cold start.
 */
export function createSampleInvoice(): InvoiceDraft {
  return {
    business: {
      name: "Quoin & Quill Letterpress",
      address: "48 Dyer Street, Studio 3\nProvidence, RI 02903",
      email: "studio@quoinandquill.example.com",
      phone: "(401) 555-0148",
    },
    customer: {
      name: "Marlow & Daughters Bakery",
      address: "219 Hope Street\nProvidence, RI 02906",
      email: "accounts@marlowdaughters.example.com",
    },
    invoiceNumber: "QQ-0041",
    issueDate: "2026-10-19",
    dueDate: "2026-11-18",
    notes:
      "Net 30, payable by check or transfer. Proofs and plates are kept on file for twelve months.",
    lineItems: [
      {
        id: "sample-line-1",
        description: "Letterpress calling cards, two colours on 600gsm cotton",
        quantity: 500,
        unitPrice: 0.74,
      },
      {
        id: "sample-line-2",
        description: "Hand-set menu suite, three plates",
        quantity: 1,
        unitPrice: 480,
      },
      {
        id: "sample-line-3",
        description: "Press time, Chandler & Price 10x15 platen (hours)",
        quantity: 2.5,
        unitPrice: 95,
      },
      {
        id: "sample-line-4",
        description: "Deckle-edge trim, per sheet",
        quantity: 300,
        unitPrice: 0.335,
      },
    ],
    discount: 25,
    taxRate: 7,
    customFields: [
      { id: "sample-field-1", label: "PO Number", value: "4412", hidden: false },
      { id: "sample-field-2", label: "Press", value: "Chandler & Price 10x15", hidden: false },
      { id: "sample-field-3", label: "Internal job code", value: "QQ-INT-88", hidden: true },
    ],
  };
}
