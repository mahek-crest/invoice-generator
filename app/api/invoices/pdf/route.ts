import { readInvoice, serverError } from "@/lib/server/http";
import { createInvoicePdf } from "@/lib/server/invoice-pdf";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const result = await readInvoice(request);
    if (result.response) return result.response;
    const pdf = await createInvoicePdf(result.invoice);
    const number =
      result.invoice.invoiceNumber
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .slice(0, 80) || "invoice";
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${number}.pdf"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
