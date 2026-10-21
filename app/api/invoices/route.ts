import { listInvoices, saveInvoice } from "@/lib/server/db";
import { readInvoice, serverError } from "@/lib/server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() {
  try {
    return Response.json(listInvoices());
  } catch (error) {
    return serverError(error);
  }
}
export async function POST(request: Request) {
  try {
    const result = await readInvoice(request);
    if (result.response) return result.response;
    return Response.json(saveInvoice(result.invoice), { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
