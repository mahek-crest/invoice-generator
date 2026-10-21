"use client";
import type { InvoiceDraft } from "@/lib/schemas";
import type { Totals } from "@/lib/totals";
import { formatCents, formatDate } from "@/lib/format";

export function InvoicePreview({
  invoice,
  totals,
}: {
  invoice: InvoiceDraft;
  totals: Totals | null;
}) {
  const money = (cents?: number) =>
    cents === undefined ? "—" : formatCents(cents);
  return (
    <article
      className="invoice-paper mx-auto min-h-[800px] max-w-[820px] bg-paper px-[38px] pt-[38px] pb-[25px] text-foreground shadow-[0_3px_15px_#182d350c] [overflow-wrap:anywhere] min-[1500px]:p-[55px] max-[1150px]:px-[22px] max-[1150px]:py-[26px] max-[900px]:p-10 max-[600px]:min-h-[700px] max-[600px]:px-5 max-[600px]:py-[25px] [&_h4]:mb-[9px] [&_h4]:font-sans [&_h4]:text-[8px] [&_h4]:font-medium [&_h4]:text-muted-foreground"
      aria-label="Invoice preview"
    >
      <header className="flex items-center gap-3 border-b-[3px] border-double border-foreground pb-[26px] max-[600px]:gap-[9px] [&_h2]:font-heading [&_h2]:text-[23px] [&_h2]:leading-[1.1] [&_h2]:font-medium max-[1150px]:[&_h2]:text-xl [&_p]:mt-[7px] [&_p]:text-[8px]">
        <div
          className="flex items-center border border-foreground pt-[5px] pr-3 pb-2 pl-[5px] font-heading text-[47px] leading-none tracking-[-5px] max-[1150px]:text-[34px] [&_span]:text-[23px]"
          aria-hidden="true"
        >
          q<span>&</span>q
        </div>
        <div>
          <h2>{invoice.business.name || "Your business"}</h2>
          <p>Fine impressions. Lasting relationships.</p>
        </div>
      </header>
      <div className="flex items-center justify-between py-7 [&_h3]:font-heading [&_h3]:text-[49px] [&_h3]:leading-none [&_h3]:font-normal [&_h3]:tracking-[-2px] max-[600px]:[&_h3]:text-[43px] [&_h3_span]:text-primary [&>div]:flex [&>div]:flex-col [&>div]:gap-1.5 [&>div]:text-right [&>div]:text-[11px] [&>div>span]:text-[8px] [&>div>span]:text-muted-foreground">
        <h3>
          Invoice<span>.</span>
        </h3>
        <div>
          <span>Invoice number</span>
          <strong>{invoice.invoiceNumber || "Untitled"}</strong>
        </div>
      </div>
      <div className="mb-[25px] grid grid-cols-2 gap-6 text-[10px] leading-[1.7] max-[600px]:gap-[15px] max-[600px]:text-[9px] [&_strong]:font-semibold [&_p]:mt-1.5 [&_p]:whitespace-pre-line">
        <section>
          <h4>From the studio</h4>
          <strong>{invoice.business.name}</strong>
          <p>{invoice.business.address}</p>
          <p>
            {invoice.business.email}
            <br />
            {invoice.business.phone}
          </p>
        </section>
        <section>
          <h4>Prepared for</h4>
          <strong>{invoice.customer.name || "Customer name"}</strong>
          <p>{invoice.customer.address}</p>
          <p>{invoice.customer.email}</p>
        </section>
      </div>
      <div className="mb-[21px] grid grid-cols-2 gap-[15px] border-y border-[#bdc9ca] py-[15px] [&>div]:flex [&>div]:flex-col [&>div]:gap-[5px] [&>div]:text-[9px] [&_span]:text-[8px] [&_span]:text-muted-foreground [&_strong]:font-medium">
        <div>
          <span>Issued</span>
          <strong>{formatDate(invoice.issueDate)}</strong>
        </div>
        <div>
          <span>Payment due</span>
          <strong>{formatDate(invoice.dueDate)}</strong>
        </div>
        {invoice.customFields
          ?.filter((field) => !field.hidden)
          .map((field) => (
            <div key={field.id}>
              <span>{field.label}</span>
              <strong>{field.value || "—"}</strong>
            </div>
          ))}
      </div>
      <table className="paper-lines w-full border-collapse text-[9px] max-[600px]:text-[8px] [&_th]:border-b [&_th]:border-foreground [&_th]:pb-2.5 [&_th]:pl-2.5 [&_th]:text-right [&_th]:text-[8px] [&_th]:font-medium [&_td]:border-b [&_td]:border-[#d6dddd] [&_td]:py-[15px] [&_td]:pl-2.5 [&_td]:text-right [&_td]:align-top [&_td]:tabular-nums [&_th:first-child]:w-[53%] [&_th:first-child]:pl-0 [&_th:first-child]:text-left [&_td:first-child]:w-[53%] [&_td:first-child]:pl-0 [&_td:first-child]:text-left [&_td:last-child]:font-semibold [&_td:last-child]:whitespace-nowrap">
        <thead>
          <tr>
            <th scope="col">Description</th>
            <th scope="col">Qty</th>
            <th scope="col">Rate</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((line, i) => (
            <tr key={line.id}>
              <td>{line.description || "Item description"}</td>
              <td>{line.quantity || "—"}</td>
              <td>
                {Number.isFinite(Number(line.unitPrice))
                  ? money(Number(line.unitPrice) * 100)
                  : "—"}
              </td>
              <td>{money(totals?.lineTotalsCents[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!invoice.lineItems.length && (
        <p className="py-[25px] text-[11px]">
          Your work deserves a good invoice. Add your first item.
        </p>
      )}
      <div className="paper-summary flex justify-end pt-5 [&_dl]:w-[66%] [&_dl]:text-[10px] max-[600px]:[&_dl]:w-4/5 [&_dl>div]:flex [&_dl>div]:justify-between [&_dl>div]:gap-3 [&_dl>div]:py-1.5">
        <dl>
          <div>
            <dt>Subtotal</dt>
            <dd>{money(totals?.subtotalCents)}</dd>
          </div>
          <div>
            <dt>Discount</dt>
            <dd>−{money(totals?.discountCents)}</dd>
          </div>
          <div>
            <dt>Tax ({invoice.taxRate || 0}%)</dt>
            <dd>{money(totals?.taxCents)}</dd>
          </div>
          <div className="mt-2.5 items-center border-t-2 border-foreground pt-4! font-semibold [&_dd]:font-heading [&_dd]:text-[30px] [&_dd]:font-medium [&_small]:mt-[3px] [&_small]:block [&_small]:text-[8px] [&_small]:font-normal">
            <dt>
              Total due <small>USD</small>
            </dt>
            <dd>{money(totals?.grandTotalCents)}</dd>
          </div>
        </dl>
      </div>
      {invoice.notes && (
        <section className="paper-notes max-w-[90%] pt-[34px] [&_p]:text-[9px] [&_p]:leading-[1.8] [&_p]:whitespace-pre-line">
          <h4>A note from the studio</h4>
          <p>{invoice.notes}</p>
        </section>
      )}
      <footer className="paper-footer mt-[35px] flex items-center justify-between gap-3.5 border-t border-foreground pt-[15px] text-[8px] italic [&>span:last-child]:text-[25px] [&>span:last-child]:not-italic">
        <span>Thank you for making something worth keeping.</span>
        <span aria-hidden="true">✳</span>
      </footer>
    </article>
  );
}
