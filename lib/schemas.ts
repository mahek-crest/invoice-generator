import { z } from "zod";

import { formatCents } from "./format";
import { calculateTotals } from "./totals";

/**
 * One set of rules for the editor and the Route Handlers. The form holds raw text
 * (that is what an <input> gives you), so the numeric fields accept a string or a
 * number on the way in and always hand back a number on the way out. Nothing here
 * rewrites a value the person typed: "12abc" is an error, not 12.
 */

const requiredText = (error: string) =>
  z
    .string({ error })
    .refine((value) => value.trim().length > 0, { error })
    .transform((value) => value.trim());

const optionalText = z
  .string()
  .default("")
  .transform((value) => value.trim());

const optionalEmail = (error: string) =>
  z
    .string()
    .default("")
    .transform((value) => value.trim())
    .refine((value) => value === "" || z.email().safeParse(value).success, { error });

const isoDate = (error: string) =>
  z.string({ error }).refine(
    (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)),
    { error },
  );

/** Accepts what people actually type into a money field, including "$1,250.00". */
function parseAmount(raw: string | number, blankIsZero: boolean): number {
  if (typeof raw === "number") return raw;

  const cleaned = raw.trim().replace(/[$,\s]/g, "");
  if (cleaned === "") return blankIsZero ? 0 : Number.NaN;

  return /^-?\d*\.?\d+$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

const amount = (options: { blankIsZero: boolean; invalid: string; negative: string }) =>
  z
    .union([z.string(), z.number()], { error: options.invalid })
    .transform((raw) => parseAmount(raw, options.blankIsZero))
    .pipe(
      z
        .number({ error: options.invalid })
        .nonnegative({ error: options.negative })
        .refine(Number.isFinite, { error: options.invalid }),
    );

export const lineItemSchema = z.object({
  id: z.string().min(1),
  description: requiredText("Describe what this line is for."),
  quantity: amount({
    blankIsZero: false,
    invalid: "Enter a quantity, like 2 or 2.5.",
    negative: "Quantity cannot be negative.",
  }),
  unitPrice: amount({
    blankIsZero: false,
    invalid: "Enter a price, like 50 or 0.74.",
    negative: "Unit price cannot be negative.",
  }),
});

export const customFieldSchema = z.object({
  id: z.string().min(1),
  label: requiredText("Give this field a label, like PO Number."),
  value: optionalText,
  /** Hidden fields stay on the invoice but are left off the preview and the print. */
  hidden: z.boolean().default(false),
});

export const invoiceSchema = z
  .object({
    business: z.object({
      name: optionalText,
      address: optionalText,
      email: optionalEmail("Enter a valid email address, like studio@example.com."),
      phone: optionalText,
    }),
    customer: z.object({
      name: requiredText("Who is this invoice for?"),
      address: optionalText,
      email: optionalEmail("Enter a valid email address, like billing@example.com."),
    }),
    invoiceNumber: requiredText("Give the invoice a number, like QQ-0041."),
    issueDate: isoDate("Pick an issue date."),
    dueDate: isoDate("Pick a due date."),
    notes: optionalText,
    lineItems: z.array(lineItemSchema).min(1, { error: "Add at least one line item." }),
    discount: amount({
      blankIsZero: true,
      invalid: "Enter a discount, like 10 or 10.50.",
      negative: "Discount cannot be negative.",
    }),
    taxRate: amount({
      blankIsZero: true,
      invalid: "Enter a tax rate, like 7 or 8.875.",
      negative: "Tax rate cannot be negative.",
    }),
    customFields: z.array(customFieldSchema).default([]),
  })
  .superRefine((invoice, ctx) => {
    const { subtotalCents, discountCents } = calculateTotals(invoice);

    if (discountCents > subtotalCents) {
      ctx.addIssue({
        code: "custom",
        path: ["discount"],
        message: `Discount can't be more than the subtotal (${formatCents(subtotalCents)}).`,
      });
    }

    if (Date.parse(invoice.dueDate) < Date.parse(invoice.issueDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date can't be before the issue date.",
      });
    }
  });

export const sendInvoiceSchema = z.object({
  to: requiredText("Enter the address to send this to.").refine(
    (value) => z.email().safeParse(value).success,
    { error: "Enter a valid email address, like billing@example.com." },
  ),
  subject: optionalText,
  message: optionalText,
});

export type Invoice = z.output<typeof invoiceSchema>;
/** What the editor holds: same shape, but numeric fields may still be raw text. */
export type InvoiceDraft = z.input<typeof invoiceSchema>;
export type LineItem = z.output<typeof lineItemSchema>;
export type CustomField = z.output<typeof customFieldSchema>;
export type SendInvoiceInput = z.output<typeof sendInvoiceSchema>;

/** A row in the saved-invoices list, built from the indexed columns only. */
export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalCents: number;
  updatedAt: string;
}

export interface SavedInvoice extends InvoiceSummary {
  createdAt: string;
  invoice: Invoice;
}

/**
 * Flattens a ZodError into one message per field, keyed by dot path
 * ("customer.name", "lineItems.0.unitPrice"). The editor looks fields up by that
 * key for aria-describedby, and the API returns the same map as its 400 body, so
 * client and server disagree about nothing.
 */
export function fieldErrorMap(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    // First message per field wins; later ones are usually knock-on effects.
    errors[key] ??= issue.message;
  }

  return errors;
}
