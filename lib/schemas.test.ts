import { describe, expect, it } from "vitest";

import { createSampleInvoice } from "./sample-invoice";
import { fieldErrorMap, invoiceSchema } from "./schemas";

/** The sample invoice with one field overridden, as the editor would hand it over. */
function draft(overrides: Record<string, unknown> = {}) {
  return { ...createSampleInvoice(), ...overrides };
}

function errorsFor(input: unknown): Record<string, string> {
  const result = invoiceSchema.safeParse(input);
  if (result.success) throw new Error("expected this invoice to fail validation");
  return fieldErrorMap(result.error);
}

describe("invoiceSchema", () => {
  it("accepts the sample invoice", () => {
    const result = invoiceSchema.safeParse(createSampleInvoice());

    expect(result.success).toBe(true);
    expect(result.data?.lineItems).toHaveLength(4);
  });

  it("reads numeric fields typed as text", () => {
    const result = invoiceSchema.parse(
      draft({
        discount: "$1,000.50",
        taxRate: "7",
        lineItems: [{ id: "a", description: "Proofing", quantity: "2", unitPrice: "750.00" }],
      }),
    );

    expect(result.discount).toBe(1000.5);
    expect(result.taxRate).toBe(7);
    expect(result.lineItems[0].quantity).toBe(2);
  });

  it("treats a blank discount as none, but a blank quantity as a mistake", () => {
    expect(invoiceSchema.parse(draft({ discount: "" })).discount).toBe(0);

    const errors = errorsFor(
      draft({ lineItems: [{ id: "a", description: "Proofing", quantity: "", unitPrice: "50" }] }),
    );
    expect(errors["lineItems.0.quantity"]).toBe("Enter a quantity, like 2 or 2.5.");
  });

  it("refuses text that is not a number instead of coercing it", () => {
    const errors = errorsFor(
      draft({ lineItems: [{ id: "a", description: "Proofing", quantity: "2 boxes", unitPrice: "50" }] }),
    );

    expect(errors["lineItems.0.quantity"]).toBe("Enter a quantity, like 2 or 2.5.");
  });

  it("rejects negative amounts on the field that is negative", () => {
    const errors = errorsFor(
      draft({
        taxRate: -1,
        lineItems: [{ id: "a", description: "Proofing", quantity: -2, unitPrice: 50 }],
      }),
    );

    expect(errors["lineItems.0.quantity"]).toBe("Quantity cannot be negative.");
    expect(errors.taxRate).toBe("Tax rate cannot be negative.");
  });

  it("names the subtotal when the discount is too large", () => {
    const errors = errorsFor(
      draft({
        discount: 100,
        lineItems: [{ id: "a", description: "Proofing", quantity: 1, unitPrice: 90 }],
      }),
    );

    expect(errors.discount).toBe("Discount can't be more than the subtotal ($90.00).");
  });

  it("allows a discount exactly equal to the subtotal", () => {
    const result = invoiceSchema.safeParse(
      draft({
        discount: 90,
        lineItems: [{ id: "a", description: "Proofing", quantity: 1, unitPrice: 90 }],
      }),
    );

    expect(result.success).toBe(true);
  });

  it("requires an invoice number, a customer name, and a described line item", () => {
    const errors = errorsFor(
      draft({
        invoiceNumber: "   ",
        customer: { name: "", address: "", email: "" },
        lineItems: [{ id: "a", description: "", quantity: 1, unitPrice: 50 }],
      }),
    );

    expect(errors.invoiceNumber).toBe("Give the invoice a number, like QQ-0041.");
    expect(errors["customer.name"]).toBe("Who is this invoice for?");
    expect(errors["lineItems.0.description"]).toBe("Describe what this line is for.");
  });

  it("requires at least one line item", () => {
    expect(errorsFor(draft({ lineItems: [] })).lineItems).toBe("Add at least one line item.");
  });

  it("checks email format but allows a blank address", () => {
    expect(
      errorsFor(draft({ customer: { name: "Marlow", address: "", email: "marlow@" } }))[
        "customer.email"
      ],
    ).toBe("Enter a valid email address, like billing@example.com.");

    expect(
      invoiceSchema.safeParse(draft({ customer: { name: "Marlow", address: "", email: "" } }))
        .success,
    ).toBe(true);
  });

  it("will not let the due date fall before the issue date", () => {
    const errors = errorsFor(draft({ issueDate: "2026-10-19", dueDate: "2026-10-18" }));

    expect(errors.dueDate).toBe("Due date can't be before the issue date.");
  });

  it("keeps hidden custom fields, flag and all", () => {
    const result = invoiceSchema.parse(createSampleInvoice());

    expect(result.customFields).toHaveLength(3);
    expect(result.customFields.filter((field) => field.hidden)).toHaveLength(1);
  });
});
