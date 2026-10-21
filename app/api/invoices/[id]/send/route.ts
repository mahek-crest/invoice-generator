import { getInvoice } from "@/lib/server/db";
import { emailConfigured, sendInvoice } from "@/lib/server/mailer";
import { notFound, serverError } from "@/lib/server/http";
import { fieldErrorMap, sendInvoiceSchema } from "@/lib/schemas";
export const runtime = "nodejs";
// A single-process budget also limits abuse when proxy IP headers are untrusted.
const attempts: number[] = [];
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const invoice = getInvoice((await context.params).id);
    if (!invoice) return notFound();
    const parsed = sendInvoiceSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success)
      return Response.json(
        {
          error: "Check the email fields.",
          errors: fieldErrorMap(parsed.error),
        },
        { status: 400 },
      );
    if (!emailConfigured())
      return Response.json(
        { error: "Email isn't set up on the server yet. See the README." },
        { status: 503 },
      );
    const now = Date.now();
    while (attempts.length && attempts[0] < now - 60000) attempts.shift();
    if (attempts.length >= 5)
      return Response.json(
        { error: "Please wait a minute before sending another invoice." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    attempts.push(now);
    await sendInvoice(invoice.invoice, parsed.data);
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
