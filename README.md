# Studio Ledger — Quoin & Quill

A customizable invoice workspace for a fictional letterpress studio. Edit an invoice beside a live typeset preview, save it locally, reload it, download a PDF, and email the saved document.

![Screenshot placeholder — add a desktop editor and preview capture](docs/screenshot.png)

## Run locally

Prerequisites: Node.js 22 LTS or newer, npm, and a persistent writable disk. better-sqlite3 uses a native module; if a prebuilt binary is unavailable, install the platform's C++ build tools.

```sh
npm install
cp .env.example .env.local
npm run dev
```

PowerShell: use `Copy-Item .env.example .env.local`. If execution policy blocks npm.ps1, use `npm.cmd`. Open http://localhost:3000. One process serves both the UI and API.

```sh
npm test
npm run lint
npm run build
npm start
```

No additional test files were introduced in this implementation; the existing totals and schema tests remain.

## Storage and email

The first API request creates `data/invoices.db`. SQLite uses WAL and stores invoice JSON alongside indexed summary columns. Keep the database, WAL and SHM files together when backing up an active database. All server modules import `server-only`; SMTP credentials never enter the browser bundle.

Copy the environment template and replace every placeholder. For Gmail, enable two-step verification and create an app password: use `smtp.gmail.com`, port `587`, `SMTP_SECURE=false`, your Gmail address as `SMTP_USER`, the app password as `SMTP_PASS`, and that same verified sender in `MAIL_FROM`. Port 465 uses `SMTP_SECURE=true`. Never commit `.env.local`.

To test safely, load the fictional sample, save it, open Send to customer, and replace the example recipient with an address you control. Email sends an HTML invoice with a plain-text fallback; it does not attach a PDF. Missing configuration returns: “Email isn't set up on the server yet. See the README.” Sending is limited to five attempts per minute per server process. Actual delivery needs working SMTP credentials and was not exercised with a real recipient.

## API

| Method | Endpoint               | Result                                                |
| ------ | ---------------------- | ----------------------------------------------------- |
| GET    | /api/invoices          | Saved summaries                                       |
| POST   | /api/invoices          | Validate and create; 201                              |
| GET    | /api/invoices/:id      | Complete saved invoice                                |
| PUT    | /api/invoices/:id      | Validate and replace                                  |
| DELETE | /api/invoices/:id      | Delete; 204                                           |
| POST   | /api/invoices/:id/send | Send saved invoice; body: `{to, subject?, message?}`  |
| POST   | /api/invoices/pdf      | Download current invoice JSON as a PDF; does not save |

Create/update accept the invoice itself, with business, customer, invoiceNumber, issueDate, dueDate, notes, lineItems, discount, taxRate, and customFields. IDs on line items/custom fields are stable strings. Invalid input returns 400 with `errors` keyed by field path; missing invoices return 404. Server failures return a generic error without leaking credentials.

## Calculation rules

Multiply quantity by unit price and round each line to cents, sum those rounded lines, subtract the fixed discount, then round tax on the discounted subtotal. Add tax to obtain the grand total. Exact decimal arithmetic avoids binary rounding drift. Two × $50, less $10, plus 10% tax equals **$99.00**. Three × $0.335 rounds to $1.01. Client totals are never trusted by the API.

## Design and decisions

Newsreader brings the letterpress character; Geist keeps the controls readable. Ink #182D35, paper #FFFEF9, slate #657780, ledger grey #E7ECEC, blue #245C73, and error red #A33030. The invoice is the focal point; the surrounding ledger is deliberately quiet. Radix-backed project UI primitives supply dialogs, confirmation, switches, and tabs; existing unused setup components remain available.

Next.js Route Handlers keep the app in one process. SQLite keeps setup small and persistence inspectable. Server recomputation prevents forged totals. PDF downloads use a Node.js Route Handler and React PDF to generate a selectable-text Letter document from the current validated draft, without saving it or opening a print dialog. Fonts are embedded from local packages, totals are recomputed, hidden custom fields are excluded, and long invoices flow across pages. Native browser printing remains supported through the print stylesheet.

SQLite needs persistent disk and a single app instance: use a persistent volume on Railway, Render, or Fly.io. An ephemeral Vercel serverless disk is unsuitable. Turso or Postgres would be appropriate alternatives for a distributed deployment.

## Scope and review

This is a local interview exercise, without authentication or tenant isolation. Do not expose the SMTP-enabled API publicly without access control. The in-memory send budget resets on restart and does not coordinate multiple instances. Invoice numbers are editable and are not required to be unique. Saved invoices persist; unsaved draft edits do not survive reload. Tax/legal compliance and payment collection are outside scope.

AI tools used: Codex continued the supplied project setup, implemented the backend, workspace, and print/email flows, and performed the checks reported in the handoff. Personal review and changes: **[fill in what you reviewed or changed yourself]**.

Time spent: **[fill in]**.

Known limitations: PDF and browser-preview layout can differ slightly, no PDF attachment, no email delivery tracking, no multi-user access, and no automated browser tests. SMTP delivery requires your own configuration.

## Verification handoff

- Existing Vitest suite: 22 tests passed. One existing schema fixture was corrected so its discount does not exceed its subtotal; no new test files were added.
- ESLint and the Next.js production build passed.
- Live API checks covered create/list/get/update/delete, server total recomputation ($99.00), hidden-field persistence, malformed JSON, field errors, recipient validation, and the exact missing-SMTP 503 response. Disposable verification invoices were removed.
- No browser was connected to this session. Visual checks at 360px, 768px, and 1280px, keyboard interaction, and print pagination still need manual review. Real SMTP delivery was not tested.

Suggested separate commit messages:

1. `feat: add SQLite invoice API and SMTP delivery`
2. `feat: build letterpress invoice editor and printable preview`
3. `docs: document setup, verification, and deployment trade-offs`

PDF export verification: generated and visually inspected a one-page sample invoice and a six-page, 70-line invoice. Checked totals, hidden-field exclusion, text bounds, attachment headers, invalid-input errors, and deployment font tracing.
