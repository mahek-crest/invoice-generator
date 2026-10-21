import { InvoiceWorkspace } from "@/components/invoice-workspace";
import { connection } from "next/server";
import { createBlankInvoice } from "@/lib/new-invoice";

export default async function Home() {
  await connection();
  return <InvoiceWorkspace initialInvoice={createBlankInvoice()} />;
}
