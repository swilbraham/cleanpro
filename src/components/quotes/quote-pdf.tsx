import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottom: "2px solid #7AC143",
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#7AC143",
  },
  companySubtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 4,
  },
  quoteTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    textAlign: "right",
  },
  quoteNumber: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 4,
  },
  // Info section
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  infoBlock: {
    width: "45%",
  },
  infoLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 10,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  infoTextBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  // Dates row
  datesRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 30,
    marginBottom: 6,
  },
  dateItem: {
    alignItems: "flex-end",
  },
  dateLabel: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  // Table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#7AC143",
    padding: 8,
    borderRadius: 2,
  },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottom: "1px solid #e5e7eb",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: 8,
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
  },
  colService: { width: "30%" },
  colDescription: { width: "30%" },
  colQty: { width: "10%", textAlign: "right" },
  colUnitPrice: { width: "15%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  // Totals
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  totalsBlock: {
    width: "40%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  totalsValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTop: "2px solid #1a1a1a",
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  // Notes
  notesSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 10,
    lineHeight: 1.4,
    color: "#374151",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 12,
  },
  footerTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    marginBottom: 4,
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
    lineHeight: 1.4,
  },
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

interface QuotePDFProps {
  quote: {
    id: string;
    quoteNumber: string;
    status: string;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    notes: string | null;
    validUntil: string | Date | null;
    createdAt: string | Date;
    customer: {
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string;
      address: string;
      city: string;
      postcode: string;
    };
    lineItems: {
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
      service: {
        name: string;
        unit: string;
      };
    }[];
  };
}

export function QuotePDF({ quote }: QuotePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>CleanPro</Text>
            <Text style={styles.companySubtitle}>
              Carpet &amp; Upholstery Cleaning
            </Text>
          </View>
          <View>
            <Text style={styles.quoteTitle}>QUOTE</Text>
            <Text style={styles.quoteNumber}>{quote.quoteNumber}</Text>
          </View>
        </View>

        {/* Customer Info & Dates */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Prepared For</Text>
            <Text style={styles.infoTextBold}>
              {quote.customer.firstName} {quote.customer.lastName}
            </Text>
            <Text style={styles.infoText}>{quote.customer.address}</Text>
            <Text style={styles.infoText}>
              {quote.customer.city}, {quote.customer.postcode}
            </Text>
            <Text style={styles.infoText}>{quote.customer.phone}</Text>
            {quote.customer.email && (
              <Text style={styles.infoText}>{quote.customer.email}</Text>
            )}
          </View>
          <View style={styles.infoBlock}>
            <View style={styles.datesRow}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Quote Date</Text>
                <Text style={styles.dateValue}>
                  {formatDate(quote.createdAt)}
                </Text>
              </View>
              {quote.validUntil && (
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Valid Until</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(quote.validUntil)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colService]}>
              Service
            </Text>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colUnitPrice]}>
              Unit Price
            </Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>
              Total
            </Text>
          </View>
          {quote.lineItems.map((item, index) => (
            <View
              key={item.id}
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={styles.colService}>{item.service.name}</Text>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnitPrice}>
                {formatCurrency(item.unitPrice)}
              </Text>
              <Text style={[styles.colTotal, { fontFamily: "Helvetica-Bold" }]}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBlock}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(quote.subtotal)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                VAT ({quote.taxRate}%)
              </Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(quote.taxAmount)}
              </Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(quote.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {quote.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Terms</Text>
          <Text style={styles.footerText}>
            This quote is valid for 30 days from the date of issue unless
            otherwise stated. Prices include all materials and labour. Any
            additional work outside the scope of this quote will be quoted
            separately.
          </Text>
          <Text style={[styles.footerText, { marginTop: 6 }]}>
            Thank you for choosing CleanPro - Carpet &amp; Upholstery Cleaning.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
