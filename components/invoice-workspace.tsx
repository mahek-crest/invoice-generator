"use client";
import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  Mail,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { InvoiceEditor, Field } from "./invoice-editor";
import { InvoicePreview } from "./invoice-preview";
import { createSampleInvoice } from "@/lib/sample-invoice";
import { createBlankInvoice } from "@/lib/new-invoice";
import {
  fieldErrorMap,
  invoiceSchema,
  lineItemSchema,
  sendInvoiceSchema,
  type InvoiceDraft,
  type InvoiceSummary,
  type SavedInvoice,
} from "@/lib/schemas";
import { calculateTotals } from "@/lib/totals";
import { formatCents } from "@/lib/format";

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error || "Something went wrong. Please try again.");
  return body;
}

export function InvoiceWorkspace({
  initialInvoice,
}: {
  initialInvoice: InvoiceDraft;
}) {
  const [draft, setDraft] = useState<InvoiceDraft>(initialInvoice);
  const [id, setId] = useState<string>();
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify(initialInvoice),
  );
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [listError, setListError] = useState("");
  const [validate, setValidate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [tab, setTab] = useState("edit");
  const [sendOpen, setSendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [email, setEmail] = useState({ to: "", subject: "", message: "" });
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState("");
  const dirty = JSON.stringify(draft) !== baseline;
  const parsed = invoiceSchema.safeParse(draft);
  const errors = validate && !parsed.success ? fieldErrorMap(parsed.error) : {};
  // Keep the preview live even when text fields are incomplete.
  let totals = null;
  const lines = draft.lineItems.map((line) =>
    lineItemSchema.safeParse({
      ...line,
      description: "Draft",
    }),
  );
  const discount = invoiceSchema.shape.discount.safeParse(draft.discount);
  const tax = invoiceSchema.shape.taxRate.safeParse(draft.taxRate);
  if (lines.every((line) => line.success) && discount.success && tax.success)
    totals = calculateTotals({
      lineItems: lines.map((line) => line.data!),
      discount: discount.data,
      taxRate: tax.data,
    });
  const notify = (message: string, error = false) => {
    setAnnouncement(message);
    if (error) toast.error(message);
    else toast.success(message);
  };
  const refresh = async () => {
    try {
      setInvoices(await api<InvoiceSummary[]>("/api/invoices"));
      setListError("");
    } catch (error) {
      setListError((error as Error).message);
    }
  };
  useEffect(() => {
    let active = true;
    api<InvoiceSummary[]>("/api/invoices")
      .then((rows) => {
        if (active) setInvoices(rows);
      })
      .catch((error) => {
        if (active) setListError(error.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function replace(invoice: InvoiceDraft, nextId?: string, saved = true) {
    setDraft(invoice);
    setId(nextId);
    setBaseline(saved ? JSON.stringify(invoice) : "");
    setValidate(false);
  }
  function guard(action: () => void) {
    if (dirty) setPending(() => action);
    else action();
  }
  async function load(nextId: string) {
    setBusy(true);
    try {
      const saved = await api<SavedInvoice>(`/api/invoices/${nextId}`);
      replace(saved.invoice, saved.id);
    } catch (error) {
      notify((error as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function save(): Promise<SavedInvoice | undefined> {
    setValidate(true);
    if (!parsed.success) {
      notify("Check the highlighted fields before saving.", true);
      setTab("edit");
      return;
    }
    setBusy(true);
    try {
      const saved = await api<SavedInvoice>(
        id ? `/api/invoices/${id}` : "/api/invoices",
        { method: id ? "PUT" : "POST", body: JSON.stringify(parsed.data) },
      );
      replace(saved.invoice, saved.id);
      await refresh();
      notify("Invoice saved.");
      return saved;
    } catch (error) {
      notify((error as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!id) return;
    setBusy(true);
    try {
      await api(`/api/invoices/${id}`, { method: "DELETE" });
      setDeleteOpen(false);
      replace(createBlankInvoice());
      await refresh();
      notify("Invoice deleted.");
    } catch (error) {
      notify((error as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function openSend() {
    const saved = dirty || !id ? await save() : { id };
    if (!saved) return;
    setEmail({
      to: draft.customer.email || "",
      subject: `Invoice ${draft.invoiceNumber} from ${draft.business.name}`,
      message: "Please find your invoice below.",
    });
    setEmailErrors({});
    setSendOpen(true);
  }
  async function send() {
    const result = sendInvoiceSchema.safeParse(email);
    if (!result.success) {
      setEmailErrors(fieldErrorMap(result.error));
      return;
    }
    setBusy(true);
    try {
      await api(`/api/invoices/${id}/send`, {
        method: "POST",
        body: JSON.stringify(result.data),
      });
      setSendOpen(false);
      notify("Invoice sent to customer.");
    } catch (error) {
      notify((error as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function downloadPdf() {
    setValidate(true);
    if (!parsed.success) {
      setTab("edit");
      notify("Check the highlighted fields before downloading.", true);
      return;
    }
    setBusy(true);
    setDownloading(true);
    try {
      const response = await fetch("/api/invoices/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Could not generate the PDF. Please try again.",
        );
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const number =
        parsed.data.invoiceNumber
          .replace(/[^a-zA-Z0-9_-]/g, "-")
          .slice(0, 80) || "invoice";
      link.download = `invoice-${number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Let the browser start reading the file before releasing its object URL.
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      notify("PDF download started.");
    } catch (error) {
      notify((error as Error).message, true);
    } finally {
      setBusy(false);
      setDownloading(false);
    }
  }
  return (
    <div className="workspace flex min-h-screen min-[901px]:h-dvh min-[901px]:overflow-hidden max-[600px]:block">
      <aside className="sidebar flex min-[901px]:overflow-y-auto w-[236px] shrink-0 flex-col border-r border-[#d5dfe0] bg-[#eaf0f0] px-5 pt-8 pb-6 max-[1150px]:w-[200px] max-[1150px]:px-3.5 max-[900px]:w-[180px] max-[600px]:grid max-[600px]:w-full max-[600px]:grid-cols-[1fr_auto] max-[600px]:gap-4 max-[600px]:border-r-0 max-[600px]:border-b max-[600px]:p-[18px]">
        <div
          className="flex items-center gap-2.5 font-heading text-[23px] max-[900px]:gap-[7px] max-[900px]:text-[19px] [&_small]:mt-[5px] [&_small]:block [&_small]:font-sans [&_small]:text-[8px] [&_small]:tracking-[1.8px] max-[900px]:[&_small]:text-[7px] max-[900px]:[&_small]:tracking-[1px]"
          aria-label="Quoin and Quill"
        >
          <span className="grid size-11 place-items-center border border-primary text-2xl tracking-[-3px] max-[900px]:h-9 max-[900px]:w-[34px] max-[900px]:text-xl">
            q&q
          </span>
          <span>
            Quoin & Quill<small>Invoice generator</small>
          </span>
        </div>
        <div className="-mx-2 mt-12 mb-4 flex items-center gap-2.5 rounded bg-[#dce7e8] p-3 font-semibold max-[600px]:hidden">
          <FileText size={17} />
          <span>Invoices</span>
          <span className="ml-auto text-xs">{invoices.length}</span>
        </div>
        <Button
          variant="outline"
          className="w-full bg-transparent max-[600px]:w-auto"
          disabled={busy}
          onClick={() => guard(() => replace(createBlankInvoice()))}
        >
          <Plus size={16} />
          New invoice
        </Button>
        <div className="mt-[30px] mb-3 text-[11px] text-muted-foreground max-[600px]:hidden">
          Saved invoices
        </div>
        <div className="max-[600px]:col-span-full max-[600px]:flex max-[600px]:gap-2 max-[600px]:overflow-x-auto max-[600px]:empty:hidden">
          {invoices.map((row) => (
            <Button
              variant="ghost"
              key={row.id}
              className="block h-auto w-full whitespace-normal rounded-[2px] border-0 border-b border-[#cfdadb] bg-transparent px-[9px] py-3.5 text-left hover:bg-[#dce7e8] data-[selected=true]:bg-[#dce7e8] max-[600px]:min-w-[180px] max-[600px]:border max-[600px]:border-[#c7d4d6] max-[600px]:p-2.5 [&>span]:flex [&>span]:justify-between [&>span]:gap-1.5 [&>span]:text-[11px] [&_b]:font-medium [&>strong]:mt-1.5 [&>strong]:block [&>strong]:text-xs [&>strong]:font-medium [&>strong]:[overflow-wrap:anywhere]"
              data-selected={id === row.id}
              disabled={busy}
              onClick={() =>
                guard(() => {
                  void load(row.id);
                })
              }
            >
              <span>
                {row.invoiceNumber}
                <b>{formatCents(row.totalCents)}</b>
              </span>
              <strong>{row.customerName}</strong>
            </Button>
          ))}
          {!invoices.length && !listError && (
            <div className="px-1 py-[35px] text-xs leading-relaxed text-muted-foreground max-[600px]:hidden [&_svg]:mb-2.5 [&_svg]:opacity-70 [&_p]:font-medium [&_p]:text-foreground">
              <FileText size={24} />
              <p>No saved invoices.</p>
              <span>Save your first invoice and it will appear here.</span>
            </div>
          )}
          {listError && (
            <div className="mt-1.5 text-[11px] leading-relaxed text-destructive">
              <p>{listError}</p>
              <Button variant="outline" onClick={refresh}>
                Retry loading
              </Button>
            </div>
          )}
        </div>
      </aside>
      <main className="main-workspace min-w-0 flex-1 min-[901px]:flex min-[901px]:min-h-0 min-[901px]:flex-col min-[1500px]:mx-auto min-[1500px]:max-w-[1600px]">
        <header className="workspace-header flex shrink-0 items-center justify-between gap-4 px-9 pt-[29px] pb-[25px] max-[1150px]:px-[25px] max-[600px]:block max-[600px]:px-5 max-[600px]:py-[23px] [&_h1]:mb-[9px] [&_h1]:font-heading [&_h1]:text-4xl [&_h1]:leading-[1.1] [&_h1]:font-medium [&_h1]:tracking-[-0.8px] max-[900px]:[&_h1]:text-[31px] max-[600px]:[&_h1]:text-[32px]">
          <div>
            <div className="mb-[21px] text-[11px] text-muted-foreground max-[600px]:mb-[17px] [&_span]:mx-3 [&_span]:text-[#8b9da4]">
              Invoice generator <span>/</span> Invoices
            </div>
            <h1>{id ? "Edit invoice" : "New invoice"}</h1>
          </div>
          <div
            className="flex items-center whitespace-nowrap text-[11px] text-muted-foreground max-[900px]:text-[10px] max-[600px]:mt-[17px]"
            role="status"
          >
            {dirty || !id ? (
              <>
                <span className="mr-[7px] inline-block size-1.5 rounded-full bg-[#956519]" />
                Unsaved draft
              </>
            ) : (
              <>
                <Check size={15} />
                All changes saved
              </>
            )}
          </div>
        </header>
        <div className="action-bar flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-y border-[#dce3e4] px-7 py-[15px] max-[600px]:gap-3 max-[600px]:p-3">
          <div className="flex flex-wrap items-center gap-[7px] max-[600px]:w-full max-[600px]:justify-between">
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() =>
                guard(() => replace(createSampleInvoice(), undefined, false))
              }
            >
              Load sample invoice
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() =>
                replace(
                  {
                    ...structuredClone(draft),
                    invoiceNumber: `${draft.invoiceNumber}-copy`,
                  },
                  undefined,
                  false,
                )
              }
            >
              <Copy size={15} />
              Duplicate
            </Button>
            {id && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete invoice"
                disabled={busy}
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-[7px] max-[600px]:grid max-[600px]:w-full max-[600px]:grid-cols-2 max-[600px]:[&>button:last-child]:col-span-full">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={downloadPdf}
                  >
                    {downloading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    {downloading ? "Generating PDF…" : "Download PDF"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Download the current invoice as a PDF file.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="outline" disabled={busy} onClick={openSend}>
              <Mail size={16} />
              Send to customer
            </Button>
            <Button disabled={busy} onClick={() => void save()}>
              {busy && !downloading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save invoice
            </Button>
          </div>
        </div>
        <Tabs
          value={tab}
          onValueChange={setTab}
          className="min-[901px]:flex min-[901px]:min-h-0 min-[901px]:flex-1 min-[901px]:flex-col"
        >
          <div className="mobile-tabs hidden max-[900px]:block max-[900px]:px-[22px] max-[900px]:py-4">
            <TabsList aria-label="Invoice workspace view">
              <TabsTrigger value="edit">Edit invoice</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>
          <div className="work-panels grid min-[901px]:min-h-0 min-[901px]:flex-1 grid-cols-[minmax(300px,0.85fr)_minmax(0,1.35fr)] max-[1150px]:grid-cols-[minmax(280px,1fr)_minmax(0,1.2fr)] max-[900px]:block">
            <TabsContent value="edit" forceMount asChild>
              <div className="editor-panel min-w-0 min-[901px]:overflow-y-auto min-[901px]:overscroll-contain border-r border-[#dce3e4] bg-[#fcfdfc] max-[900px]:data-[state=inactive]:hidden">
                <div className="flex items-center justify-between gap-2 border-b border-[#e1e7e7] px-[26px] py-[23px] [&_h2]:text-[13px] [&_h2]:font-semibold [&_span]:text-[10px] [&_span]:text-muted-foreground">
                  <h2>Invoice details</h2>
                </div>
                <fieldset className="m-0 min-w-0 border-0 p-0" disabled={busy}>
                  <InvoiceEditor
                    draft={draft}
                    setDraft={setDraft}
                    errors={errors}
                  />
                </fieldset>
              </div>
            </TabsContent>
            <TabsContent value="preview" forceMount asChild>
              <div className="preview-panel min-w-0 min-[901px]:overflow-y-auto min-[901px]:overscroll-contain bg-secondary px-7 pt-6 pb-12 max-[1150px]:px-[18px] max-[1150px]:py-[22px] max-[900px]:px-[30px] max-[900px]:pt-5 max-[900px]:pb-10 max-[900px]:data-[state=inactive]:hidden max-[600px]:px-2.5 max-[600px]:pt-[15px] max-[600px]:pb-[30px]">
                <div className="preview-caption mb-5 flex justify-between text-[10px] text-muted-foreground">
                  <span>
                    <span className="mr-[7px] inline-block size-1.5 rounded-full bg-primary" />
                    Live preview
                  </span>
                  <span>US Letter · USD</span>
                </div>
                <InvoicePreview invoice={draft} totals={totals} />
                <p className="preview-footnote mt-[19px] text-center text-[10px] text-muted-foreground">
                  Download PDF includes the current invoice details and visible
                  custom fields.
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
      <Toaster position="bottom-right" theme="light" />
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogTitle>Send invoice</DialogTitle>
          <DialogDescription>
            Your saved invoice will be included in the email body.
          </DialogDescription>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            {(["to", "subject", "message"] as const).map((key) => (
              <Field
                key={key}
                name={key}
                label={
                  {
                    to: "Recipient email",
                    subject: "Subject",
                    message: "Message (optional)",
                  }[key]
                }
                value={email[key]}
                onChange={(value) => {
                  setEmail({ ...email, [key]: value });
                  setEmailErrors({});
                }}
                errors={emailErrors}
                type={key === "to" ? "email" : "text"}
                multiline={key === "message"}
              />
            ))}
            <Button type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send to customer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes invoice {draft.invoiceNumber}.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep invoice</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={remove}
            >
              Delete invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved edits. Save the invoice first if you want to keep
            them.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const action = pending;
                setPending(null);
                action?.();
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
