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
    borderBottom: "2px solid #2563eb",
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
  },
  companySubtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    textAlign: "right",
  },
  invoiceNumber: {
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
    backgroundColor: "#2563eb",
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
  totalsDivider: {
    borderTop: "1px solid #d1d5db",
    marginVertical: 4,
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
  // Payment status
  paymentStatus: {
    marginTop: 20,
    padding: 12,
    borderRadius: 4,
    textAlign: "center",
  },
  paidStatus: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  unpaidStatus: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  partialStatus: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  overdueStatus: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  paymentStatusText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
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

interface InvoicePDFProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    dueDate: string | Date;
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
    job: {
      jobNumber: string;
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
    payments: {
      amount: number;
      status: string;
    }[];
  };
}

function getStatusStyle(status: string) {
  switch (status) {
    case "PAID":
      return styles.paidStatus;
    case "PARTIAL":
      return styles.partialStatus;
    case "OVERDUE":
      return styles.overdueStatus;
    default:
      return styles.unpaidStatus;
  }
}

function getStatusLabel(status: string, amountPaid: number, total: number) {
  switch (status) {
    case "PAID":
      return "PAID IN FULL";
    case "PARTIAL":
      return `PARTIALLY PAID - ${formatCurrency(total - amountPaid)} REMAINING`;
    case "OVERDUE":
      return "OVERDUE - PAYMENT REQUIRED IMMEDIATELY";
    case "VOID":
      return "VOID";
    default:
      return "UNPAID";
  }
}

export function InvoicePDF({ invoice }: InvoicePDFProps) {
  const amountDue = invoice.total - invoice.amountPaid;

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
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>
              {invoice.invoiceNumber}
            </Text>
          </View>
        </View>

        {/* Billing Info & Dates */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Bill To</Text>
            <Text style={styles.infoTextBold}>
              {invoice.customer.firstName} {invoice.customer.lastName}
            </Text>
            <Text style={styles.infoText}>{invoice.customer.address}</Text>
            <Text style={styles.infoText}>
              {invoice.customer.city}, {invoice.customer.postcode}
            </Text>
            <Text style={styles.infoText}>{invoice.customer.phone}</Text>
            {invoice.customer.email && (
              <Text style={styles.infoText}>{invoice.customer.email}</Text>
            )}
          </View>
          <View style={styles.infoBlock}>
            <View style={styles.datesRow}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Invoice Date</Text>
                <Text style={styles.dateValue}>
                  {formatDate(invoice.createdAt)}
                </Text>
              </View>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Due Date</Text>
                <Text style={styles.dateValue}>
                  {formatDate(invoice.dueDate)}
                </Text>
              </View>
            </View>
            <View
              style={[styles.datesRow, { marginTop: 10 }]}
            >
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Job Reference</Text>
                <Text style={styles.dateValue}>
                  {invoice.job.jobNumber}
                </Text>
              </View>
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
          {invoice.job.lineItems.map((item, index) => (
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
                {formatCurrency(invoice.subtotal)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                VAT ({invoice.taxRate}%)
              </Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(invoice.taxAmount)}
              </Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(invoice.total)}
              </Text>
            </View>
            {invoice.amountPaid > 0 && (
              <>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Amount Paid</Text>
                  <Text style={styles.totalsValue}>
                    {formatCurrency(invoice.amountPaid)}
                  </Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text
                    style={[styles.totalsLabel, { fontFamily: "Helvetica-Bold" }]}
                  >
                    Amount Due
                  </Text>
                  <Text style={styles.totalsValue}>
                    {formatCurrency(amountDue)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Payment Status */}
        <View
          style={[styles.paymentStatus, getStatusStyle(invoice.status)]}
        >
          <Text style={styles.paymentStatusText}>
            {getStatusLabel(invoice.status, invoice.amountPaid, invoice.total)}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Payment Terms</Text>
          <Text style={styles.footerText}>
            Payment is due within 14 days of the invoice date. Late payments may
            be subject to interest charges of 4% above the Bank of England base
            rate. We accept payment by card, Klarna, bank transfer, or cash.
          </Text>
          <Text style={[styles.footerText, { marginTop: 6 }]}>
            Thank you for choosing CleanPro - Carpet &amp; Upholstery Cleaning.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
