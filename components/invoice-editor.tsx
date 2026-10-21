"use client";
import type { ReactNode } from "react";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { InvoiceDraft } from "@/lib/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function Field({
  name,
  label,
  value,
  onChange,
  errors,
  multiline = false,
  type = "text",
}: {
  name: string;
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  errors: Record<string, string>;
  multiline?: boolean;
  type?: string;
}) {
  const [negativeAttempt, setNegativeAttempt] = useState(false);
  const error = negativeAttempt
    ? `${label} must be zero or greater.`
    : errors[name];
  const rejectsNegative = (text: string) => {
    if (type !== "number" || !/[-\u2212]/.test(text)) return false;
    setNegativeAttempt(true);
    return true;
  };
  const props = {
    id: name,
    value: value ?? "",
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      if (rejectsNegative(event.target.value)) return;
      setNegativeAttempt(false);
      onChange(event.target.value);
    },
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${name}-error` : undefined,
  };
  return (
    <div className="mb-4 min-w-0">
      <Label htmlFor={name}>{label}</Label>
      {multiline ? (
        <Textarea {...props} />
      ) : (
        <Input
          {...props}
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          min={type === "number" ? 0 : undefined}
          step={type === "number" ? "any" : undefined}
          onFocus={() => setNegativeAttempt(false)}
          onKeyDown={(event) => {
            if (
              !event.ctrlKey &&
              !event.metaKey &&
              !event.altKey &&
              rejectsNegative(event.key)
            ) {
              event.preventDefault();
            }
          }}
          onBeforeInput={(event) => {
            const data = (event.nativeEvent as InputEvent).data;
            if (data && rejectsNegative(data)) event.preventDefault();
          }}
          onPaste={(event) => {
            if (rejectsNegative(event.clipboardData.getData("text"))) {
              event.preventDefault();
            }
          }}
        />
      )}{" "}
      {error && (
        <p
          className="mt-1.5 text-[11px] leading-relaxed text-destructive"
          id={`${name}-error`}
          role="status"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function EditorSection({
  number,
  title,
  count,
  children,
}: {
  number: string;
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-border px-[26px] py-[25px] max-[600px]:px-5 max-[600px]:py-[22px]">
      <div className="mb-[22px] flex items-center gap-3">
        <span className="border border-border px-[5px] py-[3px] text-[10px] text-muted-foreground">
          {number}
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
        {count !== undefined && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            {count} items
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

export function InvoiceEditor({
  draft,
  setDraft,
  errors,
}: {
  draft: InvoiceDraft;
  setDraft: (draft: InvoiceDraft) => void;
  errors: Record<string, string>;
}) {
  const dayDifference = Math.round(
    (Date.parse(draft.dueDate) - Date.parse(draft.issueDate)) / 86400000,
  );
  const terms = [0, 14, 30].includes(dayDifference)
    ? String(dayDifference)
    : "custom";
  const field = (
    name: keyof InvoiceDraft,
    label: string,
    type = "text",
    multiline = false,
  ) => (
    <Field
      key={name}
      name={name}
      label={label}
      value={draft[name] as string | number}
      onChange={(value) => setDraft({ ...draft, [name]: value })}
      errors={errors}
      type={type}
      multiline={multiline}
    />
  );
  const party = (
    key: "business" | "customer",
    name: string,
    label: string,
    multiline = false,
  ) => (
    <Field
      key={name}
      name={`${key}.${name}`}
      label={label}
      value={(draft[key] as Record<string, string>)[name]}
      onChange={(value) =>
        setDraft({ ...draft, [key]: { ...draft[key], [name]: value } })
      }
      errors={errors}
      multiline={multiline}
      type={name === "email" ? "email" : "text"}
    />
  );
  return (
    <div>
      <EditorSection number="01" title="Invoice information">
        {field("invoiceNumber", "Invoice number")}
        <div className="mb-4 min-w-0">
          <Label htmlFor="payment-terms">Payment schedule</Label>
          <Select
            value={terms}
            onValueChange={(value) => {
              if (value === "custom") {
                document.getElementById("dueDate")?.focus();
                return;
              }
              if (!Number.isFinite(Date.parse(draft.issueDate))) return;
              const due = new Date(draft.issueDate);
              due.setUTCDate(due.getUTCDate() + Number(value));
              setDraft({ ...draft, dueDate: due.toISOString().slice(0, 10) });
            }}
          >
            <SelectTrigger id="payment-terms">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Due on receipt</SelectItem>
              <SelectItem value="14">Net 14 days</SelectItem>
              <SelectItem value="30">Net 30 days</SelectItem>
              <SelectItem value="custom">Custom due date</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {field("issueDate", "Issue date", "date")}
          {field("dueDate", "Due date", "date")}
        </div>
      </EditorSection>
      <EditorSection number="02" title="Customer details">
        {party("customer", "name", "Customer name")}
        {party("customer", "email", "Customer email")}
        {party("customer", "address", "Billing address", true)}
      </EditorSection>
      <EditorSection
        number="03"
        title="Line items"
        count={draft.lineItems.length}
      >
        {draft.lineItems.map((line, i) => (
          <div
            className="mb-4 grid grid-cols-2 gap-x-3 border-b border-dashed border-[#c7d2d5] [&>div:nth-child(2)]:col-span-full"
            key={line.id}
          >
            <div className="col-span-full flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Item {String(i + 1).padStart(2, "0")}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove item ${i + 1}`}
                onClick={() =>
                  setDraft({
                    ...draft,
                    lineItems: draft.lineItems.filter(
                      (item) => item.id !== line.id,
                    ),
                  })
                }
              >
                <Trash2 size={15} />
              </Button>
            </div>
            {(["description", "quantity", "unitPrice"] as const).map((key) => (
              <Field
                key={key}
                name={`lineItems.${i}.${key}`}
                label={
                  {
                    description: "Description",
                    quantity: "Quantity",
                    unitPrice: "Unit price ($)",
                  }[key]
                }
                value={line[key]}
                type={key === "description" ? "text" : "number"}
                errors={errors}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    lineItems: draft.lineItems.map((item) =>
                      item.id === line.id ? { ...item, [key]: value } : item,
                    ),
                  })
                }
              />
            ))}
          </div>
        ))}
        {!draft.lineItems.length && (
          <p className="mb-[18px] text-[11px] leading-[1.7] text-muted-foreground">
            Add a line item to include a product or service.
          </p>
        )}
        {errors.lineItems && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-destructive">
            {errors.lineItems}
          </p>
        )}
        <Button
          variant="outline"
          className="mb-[22px] w-full border-dashed bg-transparent"
          onClick={() =>
            setDraft({
              ...draft,
              lineItems: [
                ...draft.lineItems,
                {
                  id: crypto.randomUUID(),
                  description: "",
                  quantity: 1,
                  unitPrice: 0,
                },
              ],
            })
          }
        >
          <Plus size={16} />
          Add line item
        </Button>
        <div className="grid grid-cols-2 gap-3">
          {field("discount", "Discount ($)", "number")}
          {field("taxRate", "Tax rate (%)", "number")}
        </div>
      </EditorSection>
      <EditorSection number="04" title="Notes & custom fields">
        {field("notes", "Payment terms & notes", "text", true)}
        <p className="mb-[18px] text-[11px] leading-[1.7] text-muted-foreground">
          Custom fields appear on your invoice. Keep internal details hidden.
        </p>
        {draft.customFields?.map((custom, i) => (
          <div className="mb-3.5 border border-[#d5dfe0] p-3.5" key={custom.id}>
            {(["label", "value"] as const).map((key) => (
              <Field
                key={key}
                name={`customFields.${i}.${key}`}
                label={key === "label" ? "Field label" : "Field value"}
                value={custom[key]}
                errors={errors}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    customFields: draft.customFields?.map((item) =>
                      item.id === custom.id ? { ...item, [key]: value } : item,
                    ),
                  })
                }
              />
            ))}
            <div className="flex items-center gap-[9px] [&_label]:mr-auto [&_label]:text-[11px]">
              <Label htmlFor={`visible-${custom.id}`}>Show on invoice</Label>
              <Switch
                id={`visible-${custom.id}`}
                checked={!custom.hidden}
                onCheckedChange={(checked) =>
                  setDraft({
                    ...draft,
                    customFields: draft.customFields?.map((item) =>
                      item.id === custom.id
                        ? { ...item, hidden: !checked }
                        : item,
                    ),
                  })
                }
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove custom field ${custom.label || i + 1}`}
                onClick={() =>
                  setDraft({
                    ...draft,
                    customFields: draft.customFields?.filter(
                      (item) => item.id !== custom.id,
                    ),
                  })
                }
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          className="mb-[22px] w-full border-dashed bg-transparent"
          onClick={() =>
            setDraft({
              ...draft,
              customFields: [
                ...(draft.customFields || []),
                {
                  id: crypto.randomUUID(),
                  label: "",
                  value: "",
                  hidden: false,
                },
              ],
            })
          }
        >
          <Plus size={16} />
          Add custom field
        </Button>
      </EditorSection>
      <EditorSection number="05" title="Business details">
        {party("business", "name", "Business name")}
        {party("business", "address", "Business address", true)}
        {party("business", "email", "Business email")}
        {party("business", "phone", "Phone number")}
      </EditorSection>
    </div>
  );
}
