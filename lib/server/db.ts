import "server-only";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Invoice, InvoiceSummary, SavedInvoice } from "@/lib/schemas";
import { calculateTotals } from "@/lib/totals";

let database: Database.Database | undefined;
function db() {
  if (database) return database;
  mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  database = new Database(path.join(process.cwd(), "data", "invoices.db"));
  database.pragma("journal_mode = WAL");
  database.exec(`CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY, number TEXT NOT NULL, customer_name TEXT NOT NULL,
    total_cents INTEGER NOT NULL, payload TEXT NOT NULL,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  ); CREATE INDEX IF NOT EXISTS invoices_updated ON invoices(updated_at);`);
  return database;
}
const summaryColumns =
  "id, number AS invoiceNumber, customer_name AS customerName, total_cents AS totalCents, updated_at AS updatedAt";
export function listInvoices(): InvoiceSummary[] {
  return db()
    .prepare(`SELECT ${summaryColumns} FROM invoices ORDER BY updated_at DESC`)
    .all() as InvoiceSummary[];
}
export function getInvoice(id: string): SavedInvoice | undefined {
  const row = db()
    .prepare(
      `SELECT ${summaryColumns}, created_at AS createdAt, payload FROM invoices WHERE id = ?`,
    )
    .get(id) as
    (InvoiceSummary & { createdAt: string; payload: string }) | undefined;
  if (!row) return;
  const { payload, ...summary } = row;
  return { ...summary, invoice: JSON.parse(payload) as Invoice };
}
export function saveInvoice(
  invoice: Invoice,
  id: string = randomUUID(),
): SavedInvoice {
  const now = new Date().toISOString();
  const total = calculateTotals(invoice).grandTotalCents;
  db()
    .prepare(
      `INSERT INTO invoices (id, number, customer_name, total_cents, payload, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET
    number=excluded.number, customer_name=excluded.customer_name, total_cents=excluded.total_cents,
    payload=excluded.payload, updated_at=excluded.updated_at`,
    )
    .run(
      id,
      invoice.invoiceNumber,
      invoice.customer.name,
      total,
      JSON.stringify(invoice),
      now,
      now,
    );
  return getInvoice(id)!;
}
export function deleteInvoice(id: string) {
  return db().prepare("DELETE FROM invoices WHERE id = ?").run(id).changes > 0;
}
