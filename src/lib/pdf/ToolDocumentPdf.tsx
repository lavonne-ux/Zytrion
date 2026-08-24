import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#0A0F2E",
  },
  header: {
    borderBottom: "2 solid #0B3DBF",
    paddingBottom: 12,
    marginBottom: 24,
  },
  companyName: {
    fontSize: 10,
    fontWeight: 700,
    color: "#0B3DBF",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0A0F2E",
  },
  meta: {
    fontSize: 9,
    color: "#666666",
    marginTop: 4,
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 11,
    color: "#0A0F2E",
    lineHeight: 1.4,
  },
  table: {
    marginTop: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #E0E0E0",
    paddingVertical: 4,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
  },
  signatureBlock: {
    marginTop: 32,
    paddingTop: 16,
    borderTop: "1 solid #CCCCCC",
  },
  signatureLine: {
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#999999",
    textAlign: "center",
    borderTop: "1 solid #E0E0E0",
    paddingTop: 8,
  },
});

function formatFieldValue(value: any): string {
  if (value === null || value === undefined || value === "") return "Not specified";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (value.length === 0) return "None";
    return value
      .map((row) =>
        typeof row === "object" ? Object.values(row).filter(Boolean).join(", ") : String(row)
      )
      .join("; ");
  }
  return String(value);
}

export default function ToolDocumentPdf({
  toolName,
  clientName,
  businessName,
  fieldSchema,
  submittedData,
  generatedDate,
}: {
  toolName: string;
  clientName: string;
  businessName: string;
  fieldSchema: { name: string; label?: string; type: string }[];
  submittedData: Record<string, any>;
  generatedDate: string;
}) {
  const displayFields = fieldSchema.filter(
    (f) => f.type !== "generated" || f.name !== "signature"
  );
  const signatureValue = submittedData["signature"];

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>ZYTRION INFRASTRUCTURE GROUP, INC.</Text>
          <Text style={styles.title}>{toolName}</Text>
          <Text style={styles.meta}>
            {businessName || clientName} · Generated {generatedDate}
          </Text>
        </View>

        {displayFields.map((field) => {
          const value = submittedData[field.name];
          if (field.type === "repeatable_row" && Array.isArray(value) && value.length > 0) {
            return (
              <View key={field.name} style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>{field.label ?? field.name}</Text>
                <View style={styles.table}>
                  {value.map((row: Record<string, string>, i: number) => (
                    <View key={i} style={styles.tableRow}>
                      {Object.values(row).map((v, j) => (
                        <Text key={j} style={styles.tableCell}>{String(v)}</Text>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            );
          }
          return (
            <View key={field.name} style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{field.label ?? field.name}</Text>
              <Text style={styles.fieldValue}>{formatFieldValue(value)}</Text>
            </View>
          );
        })}

        {signatureValue && (
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}>{signatureValue}</Text>
            <Text style={styles.meta}>Signed and dated {generatedDate}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          © {new Date().getFullYear()} Zytrion Infrastructure Group, Inc. All rights reserved.
        </Text>
      </Page>
    </Document>
  );
}
