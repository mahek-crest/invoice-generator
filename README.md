# Invoice Generator — Quoin & Quill

A customizable invoice generator for a fictional small business. Create an invoice, edit it beside a live preview, save it in SQLite, download a PDF, and send it by email.


## Features

- Business and customer details, invoice numbers, issue dates, and payment schedules.
- Editable line items with quantities and unit prices, fixed discounts, and percentage tax.
- Live preview with an independently scrolling editor on desktop and Edit/Preview tabs on smaller screens.
- Shared client/server validation, field-specific errors, and controls that reject negative numeric entries.
- Custom fields with labels, values, and visibility switches. Hidden fields are saved but excluded from the preview, PDF, and email.
- Save, reload, duplicate, and delete invoices, with delete confirmation and unsaved-change warnings.
- Direct PDF downloads with embedded fonts and selectable text, including multi-page invoices.
- A structured HTML invoice email with a plain-text fallback, editable recipient, subject, and message.
- Loading states, success/error notifications, visible focus styles, and associated form labels.

Reloading opens a new invoice with empty customer details and line items. The fictional business details are prefilled. Saved invoices remain available in the sidebar; sample data is available through **Load sample invoice**. Unsaved edits do not survive a reload.

## Technology

| Area        | Implementation                                                         |
| ----------- | ---------------------------------------------------------------------- |
| Application | Next.js App Router, React, TypeScript                                  |
| Interface   | Tailwind CSS, customized shadcn/Radix components, Lucide icons, Sonner |
| Validation  | Zod schemas shared by the browser and API                              |
| Backend     | Next.js Route Handlers running in Node.js                              |
| Database    | SQLite through better-sqlite3                                          |
| PDF export  | @react-pdf/renderer with locally installed Geist and Newsreader fonts  |
| Email       | Nodemailer with SMTP                                                   |
| Checks      | Vitest, ESLint, TypeScript through the Next.js build                   |

## Prerequisites

- Node.js **24.x**, or Node.js **22.x version 22.12 or newer**. These versions satisfy the installed application and test dependencies.
- npm.
- A writable local disk for SQLite.
- An SMTP account if you want to send emails. Editing, saving, and downloading PDFs do not require SMTP.

better-sqlite3 is a native dependency. If npm cannot use a prebuilt binary for your platform, install the required C++ build tools or use a supported Node.js version with an available binary. The web fonts loaded by next/font require network access during an uncached build; the PDF fonts are installed locally with npm.

## Local setup

Run these commands from the project directory containing package.json.

### Windows PowerShell

```powershell
cd invoice-generator
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run dev
```

Skip the Copy-Item command if .env.local already exists so you keep your existing configuration. If your terminal is already inside invoice-generator, skip the cd command. npm.cmd avoids PowerShell's npm.ps1 execution-policy restriction.

### macOS / Linux

```sh
cd invoice-generator
npm install
cp .env.example .env.local
npm run dev
```

Skip copying the environment template if .env.local already exists.

Open **http://localhost:3000**. One Next.js process serves both the interface and API. No database installation, migration command, or seed command is needed.

The template contains placeholders. Replace them using the SMTP instructions below before attempting to send email. Keep real credentials in .env.local and leave .env.example safe to commit. Next.js also reads .env; prefer one local configuration file to avoid conflicting values. Values in .env.local take precedence over the same keys in .env, unless already supplied by the process environment.

## SMTP setup

### Gmail example

1. Enable **2-Step Verification** in your [Google Account security settings](https://myaccount.google.com/security).
2. Open [App passwords](https://myaccount.google.com/apppasswords), create one named `Invoice Generator`, and copy the generated password. Use this app password for SMTP, rather than your normal account password. Google requires 2-Step Verification for app passwords; availability can depend on account restrictions. See [Google's app-password instructions](https://support.google.com/mail/answer/185833?hl=en).
3. Open .env.local in the project root and replace the placeholders:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@gmail.com
SMTP_PASS=your16characterapppassword
MAIL_FROM="Quoin & Quill <yourname@gmail.com>"
```

Use your full Gmail address for SMTP_USER, paste the app password without its display spaces, and use the same address in MAIL_FROM. Gmail's SMTP server supports port **587 for TLS** and **465 for SSL**. See [Google's SMTP configuration instructions](https://support.google.com/a/answer/176600?hl=en).

4. Stop the development server with Ctrl+C, then restart it after saving the environment file:

```powershell
npm.cmd run dev
```

For this transport configuration, use the following matching settings:

| Port | SMTP_SECURE | Connection                                         |
| ---- | ----------- | -------------------------------------------------- |
| 587  | false       | STARTTLS upgrade when supported by the SMTP server |
| 465  | true        | TLS connection from the start                      |

### Environment variables

| Variable    | Purpose                                                                          |
| ----------- | -------------------------------------------------------------------------------- |
| SMTP_HOST   | Your provider's SMTP server hostname                                             |
| SMTP_PORT   | SMTP connection port                                                             |
| SMTP_SECURE | `true` for implicit TLS; `false` for a connection that can upgrade with STARTTLS |
| SMTP_USER   | SMTP login username                                                              |
| SMTP_PASS   | SMTP password, app password, or provider-issued SMTP credential                  |
| MAIL_FROM   | Sender address, optionally including a display name                              |

For another SMTP provider, use its documented host, port, credentials, and authorized sender. The current transport expects username/password authentication. It does not implement OAuth or an unauthenticated SMTP mode.

All SMTP handling runs on the server. Never prefix credentials with NEXT_PUBLIC_, paste them into frontend code, or commit .env/.env.local. Local environment files are gitignored; .env.example contains placeholders only.

### Send a test invoice

1. Start the app and select **Load sample invoice**, or complete a new invoice.
2. Save the invoice, then select **Send to customer**. The app also saves any pending edits before opening the send dialog.
3. Replace the fictional recipient with an email address you control.
4. Review the subject and message, then send.
5. Check the recipient's inbox and spam folder.

The email includes business/customer details, dates, line items, totals, visible custom fields, and payment notes. User-entered HTML is escaped. A plain-text version is sent alongside the HTML version. **The PDF is downloaded separately; it is not attached to the email.**

A successful send means the SMTP server accepted the message; the app does not track final delivery or opens. Sending is limited to **five attempts per minute across each server process**. Failed transport attempts also use that budget, and the budget resets on restart.

### Email troubleshooting

| Problem                                                 | What to check                                                                                                                                        |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| “Email isn't set up on the server yet. See the README.” | One or more required SMTP values are missing or blank. Fill in SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and MAIL_FROM, then restart.              |
| Authentication error in the server terminal             | Check the full username and SMTP/app password. Placeholder values are not usable credentials. For Gmail, check that the app password is still valid. |
| Connection timeout or connection refused                | Check the hostname, port, network access, and whether your host permits outbound SMTP.                                                               |
| TLS/SSL connection error                                | Match SMTP_SECURE to the provider's selected port.                                                                                                   |
| Sender rejected                                         | Use the authenticated address or another sender explicitly authorized by your provider.                                                              |
| HTTP 429                                                | Wait at least a minute before retrying; check the Retry-After response header.                                                                       |
| Send succeeds but email is missing                      | Check spam, recipient spelling, and your provider's delivery logs.                                                                                   |

Transport failures show a generic error in the interface; inspect the server terminal for the underlying SMTP error. Do not share logs containing credentials.

## Using the app

1. Complete invoice information, customer details, and at least one described line item.
2. Enter quantities, unit prices, discount, and tax. Review the live totals.
3. Add optional custom fields and choose which ones appear on customer-facing documents.
4. Save the invoice to add it to the sidebar. Select a saved invoice to reload it.
5. Select **Download PDF** to export the current validated draft. This does not save or overwrite an invoice.
6. Select **Send to customer** to save pending changes and email the saved invoice.

Duplicate creates an unsaved copy that you can edit before saving. Delete permanently removes a saved invoice after confirmation. The browser's normal print command remains supported through a dedicated print stylesheet.

## Totals and validation

All amounts are in **USD**. The calculation order is:

1. Multiply quantity by unit price and round each line to cents.
2. Add those rounded line totals to get the subtotal.
3. Subtract the fixed discount.
4. Calculate tax on the discounted subtotal and round tax to cents.
5. Add tax to get the grand total.

Example:

```text
2 × $50.00       $100.00
Discount        -$10.00
Taxable amount   $90.00
Tax at 10%        $9.00
Grand total      $99.00
```

Exact decimal arithmetic avoids binary floating-point drift: for example, 3 × $0.335 rounds to $1.01. Display formatting uses Intl.NumberFormat for USD.

Shared Zod rules reject negative quantities, prices, discounts, and tax rates; discounts above the subtotal; invalid email addresses and dates; due dates before issue dates; missing invoice numbers/customer names; and missing or undescribed line items. Numeric values are limited to 1,000,000, invoices to 100 line items, and totals must fit JavaScript's safe integer range in cents. Custom fields never affect calculations.

The server validates incoming invoice data and recomputes totals when saving or generating a PDF. Browser-supplied totals are not trusted.

## Database

The first invoice API request automatically creates **data/invoices.db** and its table. No separate database service is required.

Each invoice stores:

- A UUID primary key.
- Separate columns for invoice number, customer name, total in cents, and creation/update timestamps.
- A JSON payload containing all invoice details, line items, and custom fields, including hidden flags.

Summary columns let the sidebar list invoices without parsing every JSON payload. An index on updated_at supports ordering recently updated invoices. Queries use prepared statements. WAL mode allows reads to coexist with writes; the application reuses a database connection within the process.

The database and its journal files are gitignored. Saved invoices survive page reloads and server restarts while the data directory is retained. Use a SQLite-aware backup, or stop the application before copying the database, to keep backups consistent.

## API reference

All routes run in the Node.js runtime. Send JSON request bodies with Content-Type: application/json.

| Method | Endpoint               | Purpose                                                        | Success              |
| ------ | ---------------------- | -------------------------------------------------------------- | -------------------- |
| GET    | /api/invoices          | List summaries: ID, number, customer, total, updated timestamp | 200                  |
| POST   | /api/invoices          | Validate and save a new invoice                                | 201                  |
| GET    | /api/invoices/:id      | Load a saved invoice and metadata                              | 200                  |
| PUT    | /api/invoices/:id      | Replace an existing invoice                                    | 200                  |
| DELETE | /api/invoices/:id      | Delete an invoice                                              | 204                  |
| POST   | /api/invoices/:id/send | Email a saved invoice                                          | 200                  |
| POST   | /api/invoices/pdf      | Generate a PDF from invoice JSON without saving                | 200, application/pdf |

Create, update, and PDF endpoints accept the invoice itself, with business, customer, invoiceNumber, issueDate, dueDate, notes, lineItems, discount, taxRate, and customFields. Each line item and custom field needs a stable, nonempty string ID. See lib/schemas.ts for the complete types and rules.

The send endpoint accepts:

```json
{
  "to": "recipient@example.com",
  "subject": "Invoice QQ-0041",
  "message": "Please find your invoice below."
}
```

The recipient is required; subject and message are optional.

| Status | Meaning                                                             |
| ------ | ------------------------------------------------------------------- |
| 400    | Invalid invoice/email data or malformed JSON; includes field errors |
| 404    | Saved invoice not found                                             |
| 429    | Email send rate limit reached                                       |
| 500    | Database, PDF, or mail transport operation failed                   |
| 503    | Required SMTP configuration is missing                              |

Validation responses have an error message and an errors map keyed by paths such as customer.name or lineItems.0.unitPrice. Internal failure details are logged on the server rather than returned to the browser.

## Project structure

```text
app/
  page.tsx                    New invoice entry point
  layout.tsx                  Page metadata and web fonts
  globals.css                 Theme tokens, base styles, print rules
  api/invoices/               CRUD, email, and PDF Route Handlers
components/
  invoice-workspace.tsx        State and save/load/export/send actions
  invoice-editor.tsx           Shared fields and editor sections
  invoice-preview.tsx          Live invoice document
  ui/                          Shared shadcn/Radix components
lib/
  schemas.ts                   Shared validation and types
  totals.ts                    Pure calculation logic
  format.ts                    Currency/date formatting
  new-invoice.ts               New invoice defaults
  sample-invoice.ts            Fictional demonstration data
  server/
    db.ts                      SQLite access
    http.ts                    Shared API validation/error responses
    invoice-pdf.tsx            PDF document generation
    email-template.ts          HTML and plain-text email generation
    mailer.ts                  SMTP transport
```

## Design and technical decisions

- **Tailwind and shadcn/Radix:** utility classes handle layout and responsive styling; reusable components provide controls and dialogs. Global CSS holds theme tokens, base rules, printing, and reduced-motion handling.
- **Typography and palette:** Newsreader headings and Geist interface text, with ink (#182D35), paper (#FFFEF9), blue (#245C73), ledger grey (#E7ECEC), and error red (#A33030). Labels and messages use direct wording.
- **Next.js Route Handlers:** keep the interface and backend in one application and process.
- **SQLite:** provides simple local persistence with no external service; JSON keeps custom invoice fields flexible while summary columns make listing straightforward.
- **Server recomputation:** applies the same trusted money calculation when storing or exporting invoices.
- **Direct PDF generation:** React PDF exports selectable text and handles page wrapping without browser print settings. The PDF has a separate document layout, so its spacing can differ slightly from the preview. Font files are included in deployment tracing.
- **Email-specific HTML:** presentational tables and inline styles keep the template self-contained. It does not depend on the application's Tailwind stylesheet or browser JavaScript.
- **Server-only modules:** database, PDF, SMTP, and email-template modules are excluded from client imports using server-only boundaries.

## Checks and production build

```sh
npm test
npm run lint
npm run build
npm start
```

In PowerShell, use npm.cmd in place of npm if needed. npm start requires a successful build. npm run test:watch runs the existing Vitest suite interactively.

The existing totals/schema suite contains 22 tests. Lint and production-build checks have passed during development. Additional checks covered invoice CRUD, server total recomputation, field errors, email-template escaping, hidden-field exclusion, and PDF export. A one-page sample PDF and a six-page, 70-line PDF were visually inspected.

Manual checks to perform before sharing: responsive layouts at 360px, 768px, and 1280px; keyboard interaction; native print pagination; and actual email rendering/delivery using an address you control. Automated checks do not establish inbox delivery or identical rendering across email clients.


## AI assistance and project notes

Codex helped continue the initial setup and implement/refine the interface, API, persistence, PDF export, email template, and validation. It also assisted with code checks and documentation.