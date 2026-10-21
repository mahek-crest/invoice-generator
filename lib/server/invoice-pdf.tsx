import "server-only";
import path from "node:path";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Invoice } from "@/lib/schemas";
import { calculateTotals } from "@/lib/totals";
import { formatCents, formatDate } from "@/lib/format";

const fontPath = (family: string, weight: number) =>
  path.join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    family,
    "files",
    `${family}-latin-${weight}-normal.woff`,
  );
Font.register({
  family: "Geist",
  fonts: [
    { src: fontPath("geist", 400) },
    { src: fontPath("geist", 600), fontWeight: 600 },
  ],
});
Font.register({ family: "Newsreader", src: fontPath("newsreader", 400) });

const ink = "#182d35";
const styles = StyleSheet.create({
  page: {
    padding: 42,
    paddingBottom: 52,
    fontFamily: "Geist",
    fontSize: 9,
    lineHeight: 1.5,
    color: ink,
    backgroundColor: "#fffef9",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: ink,
  },
  mark: {
    fontFamily: "Newsreader",
    fontSize: 30,
    lineHeight: 1,
    borderWidth: 1,
    borderColor: ink,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  business: { fontFamily: "Newsreader", fontSize: 23, flex: 1 },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  title: { fontFamily: "Newsreader", fontSize: 38, lineHeight: 1.1 },
  label: { fontSize: 8, color: "#53666e", marginBottom: 5 },
  bold: { fontWeight: 600 },
  parties: { flexDirection: "row", gap: 26, marginBottom: 14 },
  party: { width: "50%" },
  paragraph: { marginTop: 5 },
  metadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#bdc9ca",
    paddingTop: 12,
    marginBottom: 12,
  },
  metadataItem: { width: "50%", paddingRight: 12, paddingBottom: 12 },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: ink,
    paddingBottom: 8,
    fontSize: 8,
    color: "#53666e",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#d6dddd",
  },
  description: { width: "52%", paddingRight: 14 },
  quantity: { width: "12%", textAlign: "right", paddingRight: 8 },
  price: { width: "18%", textAlign: "right", paddingLeft: 5 },
  summary: { width: "62%", alignSelf: "flex-end", marginTop: 14 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 4,
  },
  total: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: ink,
  },
  totalAmount: { fontFamily: "Newsreader", fontSize: 28, lineHeight: 1.1 },
  notes: { marginTop: 16 },
});

function InvoiceDocument({ invoice }: { invoice: Invoice }) {
  const totals = calculateTotals(invoice);
  const metadata = [
    { id: "issued", label: "Issued", value: formatDate(invoice.issueDate) },
    { id: "due", label: "Payment due", value: formatDate(invoice.dueDate) },
    ...invoice.customFields.filter((field) => !field.hidden),
  ];
  return (
    <Document
      title={`Invoice ${invoice.invoiceNumber}`}
      author={invoice.business.name}
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.brand} wrap={false}>
          <Text style={styles.mark}>q&amp;q</Text>
          <Text style={styles.business}>{invoice.business.name}</Text>
        </View>
        <View style={styles.heading} wrap={false}>
          <Text style={styles.title}>Invoice</Text>
          <View>
            <Text style={styles.label}>Invoice number</Text>
            <Text style={styles.bold}>{invoice.invoiceNumber}</Text>
          </View>
        </View>
        <View style={styles.parties}>
          <View style={styles.party}>
            <Text style={styles.label}>From</Text>
            <Text style={styles.bold}>{invoice.business.name}</Text>
            <Text style={styles.paragraph}>{invoice.business.address}</Text>
            <Text style={styles.paragraph}>{invoice.business.email}</Text>
            <Text>{invoice.business.phone}</Text>
          </View>
          <View style={styles.party}>
            <Text style={styles.label}>Bill to</Text>
            <Text style={styles.bold}>{invoice.customer.name}</Text>
            <Text style={styles.paragraph}>{invoice.customer.address}</Text>
            <Text style={styles.paragraph}>{invoice.customer.email}</Text>
          </View>
        </View>
        <View style={styles.metadata}>
          {metadata.map((field) => (
            <View key={field.id} style={styles.metadataItem}>
              <Text style={styles.label} minPresenceAhead={15}>
                {field.label}
              </Text>
              <Text>{field.value || "—"}</Text>
            </View>
          ))}
        </View>
        <View style={styles.tableHead} minPresenceAhead={35}>
          <Text style={styles.description}>Description</Text>
          <Text style={styles.quantity}>Qty</Text>
          <Text style={styles.price}>Rate</Text>
          <Text style={styles.price}>Amount</Text>
        </View>
        {invoice.lineItems.map((line, i) => (
          <View
            key={line.id}
            style={styles.row}
            wrap={line.description.length > 600}
          >
            <Text style={styles.description}>{line.description}</Text>
            <Text style={styles.quantity}>{line.quantity}</Text>
            <Text style={styles.price}>
              {formatCents(line.unitPrice * 100)}
            </Text>
            <Text style={[styles.price, styles.bold]}>
              {formatCents(totals.lineTotalsCents[i])}
            </Text>
          </View>
        ))}
        <View style={styles.summary} wrap={false}>
          <View style={styles.summaryRow}>
            <Text>Subtotal</Text>
            <Text>{formatCents(totals.subtotalCents)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Discount</Text>
            <Text>−{formatCents(totals.discountCents)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Tax ({invoice.taxRate}%)</Text>
            <Text>{formatCents(totals.taxCents)}</Text>
          </View>
          <View style={styles.total}>
            <View>
              <Text style={styles.bold}>Total due</Text>
              <Text style={styles.label}>USD</Text>
            </View>
            <Text style={styles.totalAmount}>
              {formatCents(totals.grandTotalCents)}
            </Text>
          </View>
        </View>
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.label} minPresenceAhead={25}>
              Payment terms &amp; notes
            </Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export function createInvoicePdf(invoice: Invoice) {
  return renderToBuffer(<InvoiceDocument invoice={invoice} />);
}
