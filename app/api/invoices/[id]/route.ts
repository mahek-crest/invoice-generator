import { getInvoice, saveInvoice, deleteInvoice } from "@/lib/server/db";
import { readInvoice, notFound, serverError } from "@/lib/server/http";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const invoice = getInvoice((await context.params).id);
    return invoice ? Response.json(invoice) : notFound();
  } catch (error) {
    return serverError(error);
  }
}
export async function PUT(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!getInvoice(id)) return notFound();
    const result = await readInvoice(request);
    if (result.response) return result.response;
    return Response.json(saveInvoice(result.invoice, id));
  } catch (error) {
    return serverError(error);
  }
}
export async function DELETE(_request: Request, context: Context) {
  try {
    return deleteInvoice((await context.params).id)
      ? new Response(null, { status: 204 })
      : notFound();
  } catch (error) {
    return serverError(error);
  }
}
