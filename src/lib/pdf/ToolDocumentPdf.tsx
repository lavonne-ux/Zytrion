import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import {
  OrganizationalResolutionDocument,
  CompensationDistributionResolutionDocument,
} from "./ResolutionDocument";
import { FinancialApprovalThresholdsDocument } from "./ThresholdsDocument";
import { AuthorityMatrixDocument } from "./AuthorityMatrixDocument";
import { ReimbursementPolicyDocument } from "./ReimbursementPolicyDocument";
import { RoleAccountabilityStandardDocument } from "./RoleAccountabilityStandardDocument";
import { loadFont } from "./loadFont";

Font.register({
  family: "Carlito",
  fonts: [
    { src: loadFont("Carlito-Regular.ttf"), fontWeight: "normal", fontStyle: "normal" },
    { src: loadFont("Carlito-Bold.ttf"), fontWeight: "bold", fontStyle: "normal" },
    { src: loadFont("Carlito-Italic.ttf"), fontWeight: "normal", fontStyle: "italic" },
    { src: loadFont("Carlito-BoldItalic.ttf"), fontWeight: "bold", fontStyle: "italic" },
  ],
});

// react-pdf's global Font.registerHyphenationCallback does not reach the renderer's
// internal FontStore instance, so it has no effect here — the fix lives on each
// Text node below (hyphenationCallback prop) plus left-aligned body text, which
// removes the width-fitting pressure that forces a hyphen into a name or short
// word. Do not switch these blocks back to textAlign: "justify" without retesting.
const noHyphen = (word: string) => [word];

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Carlito",
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
    fontWeight: "bold",
    color: "#0B3DBF",
    letterSpacing: 1,
    marginBottom: 4,
  },
  letterheadRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  logoImage: {
    width: 28,
    height: 28,
    marginRight: 10,
    objectFit: "contain",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
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
    fontWeight: "bold",
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 11,
    color: "#0A0F2E",
    lineHeight: 1.4,
    textAlign: "left",
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

/**
 * GENERIC fallback renderer. Still a flat field-by-field layout, not a real
 * document genre, for every form-type tool that has not yet been given its own
 * real template below. Upgraded to Carlito, left-aligned, brand-consistent
 * styling so it is not visually inconsistent with the real instruments, but
 * this is still fact-sheet output, not a governance instrument. Only
 * Authority Delegation Memo still falls through to this generic renderer,
 * and only because it has no field_schema defined yet in the tools table —
 * it needs one before it can get a real document genre, the same way
 * Organizational Resolution, Compensation and Distribution Resolution,
 * Financial Approval Thresholds, Authority Matrix, Reimbursement Policy,
 * and Role Accountability Standard now all have.
 */
function GenericToolDocument({
  toolName,
  clientName,
  businessName,
  fieldSchema,
  submittedData,
  generatedDate,
  logoUrl,
}: {
  toolName: string;
  clientName: string;
  businessName: string;
  fieldSchema: { name: string; label?: string; type: string }[];
  submittedData: Record<string, any>;
  generatedDate: string;
  logoUrl?: string | Buffer | null;
}) {
  const displayFields = fieldSchema.filter(
    (f) => f.type !== "generated" || f.name !== "signature"
  );
  const signatureValue = submittedData["signature"];
  const documentOwnerName = businessName || clientName;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          {logoUrl ? (
            <View style={styles.letterheadRow}>
              <Image src={logoUrl} style={styles.logoImage} />
              <Text style={styles.companyName} hyphenationCallback={noHyphen}>{documentOwnerName.toUpperCase()}</Text>
            </View>
          ) : (
            <Text style={styles.companyName} hyphenationCallback={noHyphen}>{documentOwnerName.toUpperCase()}</Text>
          )}
          <Text style={styles.title} hyphenationCallback={noHyphen}>{toolName}</Text>
          <Text style={styles.meta} hyphenationCallback={noHyphen}>Generated {generatedDate}</Text>
        </View>

        {displayFields.map((field) => {
          const value = submittedData[field.name];
          if (field.type === "repeatable_row" && Array.isArray(value) && value.length > 0) {
            return (
              <View key={field.name} style={styles.fieldBlock}>
                <Text style={styles.fieldLabel} hyphenationCallback={noHyphen}>{field.label ?? field.name}</Text>
                <View style={styles.table}>
                  {value.map((row: Record<string, string>, i: number) => (
                    <View key={i} style={styles.tableRow}>
                      {Object.values(row).map((v, j) => (
                        <Text key={j} style={styles.tableCell} hyphenationCallback={noHyphen}>{String(v)}</Text>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            );
          }
          return (
            <View key={field.name} style={styles.fieldBlock}>
              <Text style={styles.fieldLabel} hyphenationCallback={noHyphen}>{field.label ?? field.name}</Text>
              <Text style={styles.fieldValue} hyphenationCallback={noHyphen}>
                {formatFieldValue(value)}
              </Text>
            </View>
          );
        })}

        {signatureValue && (
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine} hyphenationCallback={noHyphen}>{signatureValue}</Text>
            <Text style={styles.meta} hyphenationCallback={noHyphen}>Signed and dated {generatedDate}</Text>
          </View>
        )}

        <Text style={styles.footer} hyphenationCallback={noHyphen}>
          © {new Date().getFullYear()} Zytrion Infrastructure Group, Inc. All rights reserved.
        </Text>
      </Page>
    </Document>
  );
}

// Tool names route to a real document genre here. Add a new case as each
// additional form-type tool gets its own real template; anything not listed
// falls through to the generic renderer above.
export default function ToolDocumentPdf(props: {
  toolName: string;
  clientName: string;
  businessName: string;
  fieldSchema: { name: string; label?: string; type: string }[];
  submittedData: Record<string, any>;
  generatedDate: string;
  logoUrl?: string | Buffer | null;
}) {
  switch (props.toolName) {
    case "Organizational Resolution":
      return (
        <OrganizationalResolutionDocument
          clientName={props.clientName}
          businessName={props.businessName}
          submittedData={props.submittedData}
          generatedDate={props.generatedDate}
          logoUrl={props.logoUrl}
        />
      );
    case "Compensation and Distribution Resolution":
      return (
        <CompensationDistributionResolutionDocument
          clientName={props.clientName}
          businessName={props.businessName}
          submittedData={props.submittedData}
          generatedDate={props.generatedDate}
          logoUrl={props.logoUrl}
        />
      );
    case "Financial Approval Thresholds":
      return (
        <FinancialApprovalThresholdsDocument
          clientName={props.clientName}
          businessName={props.businessName}
          submittedData={props.submittedData}
          generatedDate={props.generatedDate}
          logoUrl={props.logoUrl}
        />
      );
    case "Authority Matrix":
      return (
        <AuthorityMatrixDocument
          clientName={props.clientName}
          businessName={props.businessName}
          fieldSchema={props.fieldSchema}
          submittedData={props.submittedData}
          generatedDate={props.generatedDate}
          logoUrl={props.logoUrl}
        />
      );
    case "Reimbursement Policy":
      return (
        <ReimbursementPolicyDocument
          clientName={props.clientName}
          businessName={props.businessName}
          submittedData={props.submittedData}
          generatedDate={props.generatedDate}
          logoUrl={props.logoUrl}
        />
      );
    case "Role Accountability Standard":
      return (
        <RoleAccountabilityStandardDocument
          clientName={props.clientName}
          businessName={props.businessName}
          submittedData={props.submittedData}
          generatedDate={props.generatedDate}
          logoUrl={props.logoUrl}
        />
      );
    default:
      return <GenericToolDocument {...props} />;
  }
}
