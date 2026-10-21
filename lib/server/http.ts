import "server-only";
import { fieldErrorMap, invoiceSchema } from "@/lib/schemas";

export async function readInvoice(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success)
    return {
      response: Response.json(
        {
          error: "Check the highlighted fields.",
          errors: fieldErrorMap(parsed.error),
        },
        { status: 400 },
      ),
    };
  return { invoice: parsed.data };
}
export const notFound = () =>
  Response.json({ error: "Invoice not found." }, { status: 404 });
export function serverError(error: unknown) {
  console.error("Invoice operation failed:", error);
  return Response.json(
    { error: "The server could not complete this request. Please try again." },
    { status: 500 },
  );
}
