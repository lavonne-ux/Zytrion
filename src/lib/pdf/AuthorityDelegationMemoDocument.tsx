import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
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

const noHyphen = (word: string) => [word];

const NAVY = "#0A0F2E";
const ROYAL = "#0B3DBF";
const STEEL = "#5B6472";
const HAIRLINE = "#D8DCE5";

const styles = StyleSheet.create({
  page: {
    paddingTop: 64,
    paddingBottom: 72,
    paddingHorizontal: 60,
    fontFamily: "Carlito",
    fontSize: 11,
    color: NAVY,
    lineHeight: 1.5,
  },
  entityName: { fontSize: 9, fontWeight: "bold", color: ROYAL, letterSpacing: 1.2, marginBottom: 6 },
  letterheadRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  logoImage: { width: 28, height: 28, marginRight: 10, objectFit: "contain" },
  rule: { borderBottom: `1.5 solid ${ROYAL}`, marginBottom: 22 },
  caption: {
    fontSize: 9, fontWeight: "bold", color: STEEL, textTransform: "uppercase",
    letterSpacing: 1, textAlign: "center", marginBottom: 4,
  },
  documentTitle: { fontSize: 14, fontWeight: "bold", color: NAVY, textAlign: "center", marginBottom: 18 },
  memoHeader: {
    borderTop: `1 solid ${HAIRLINE}`, borderBottom: `1 solid ${HAIRLINE}`, paddingVertical: 10, marginBottom: 20,
  },
  memoRow: { flexDirection: "row", marginBottom: 4 },
  memoLabel: { width: 90, fontSize: 10, fontWeight: "bold", color: STEEL, textTransform: "uppercase", letterSpacing: 0.4 },
  memoValue: { flex: 1, fontSize: 11, color: NAVY },
  paragraph: { fontSize: 11, color: NAVY, marginBottom: 14, textAlign: "left" },
  sectionLabel: { fontSize: 9, fontWeight: "bold", color: ROYAL, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },
  resolvedLabel: { fontWeight: "bold" },
  signatureBlock: { marginTop: 20 },
  signatureLine: { borderBottom: `1 solid ${NAVY}`, width: 260, marginBottom: 4 },
  signatureMeta: { fontSize: 9, color: STEEL },
  signatureRole: { fontSize: 9, fontWeight: "bold", color: STEEL, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 14 },
  footer: {
    position: "absolute", bottom: 30, left: 60, right: 60, fontSize: 8, color: "#9AA1AD",
    textAlign: "center", borderTop: `1 solid ${HAIRLINE}`, paddingTop: 8,
  },
});

function Footer() {
  return (
    <Text style={styles.footer} fixed hyphenationCallback={noHyphen}>
      Prepared using the Zytrion Governance Standard. This document does not constitute legal advice; consult
      qualified counsel before relying on it for a governance or tax decision.
      {"\n"}© {new Date().getFullYear()} Zytrion Infrastructure Group, Inc. All rights reserved.
    </Text>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function toSentenceFragment(text: string): string {
  const trimmed = text.trim().replace(/[.\s]+$/, "");
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

function formatCurrency(value: string | number): string {
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  if (isNaN(n)) return String(value);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/**
 * The additional-approvals field is a fixed-options-plus-custom select, the
 * same pattern the Authority Matrix uses for joint approval combinations, so
 * a client can name whichever reviewers actually exist in their business —
 * "General Counsel and Chief Financial Officer", a custom entry like "Board
 * of Directors", or simply "None" for a sole founder with no such roles yet.
 * Splitting on the common joiners turns that one field into one signature
 * block per named reviewer, so the memo scales to the client's actual org
 * instead of assuming everyone is a solo operator.
 */
function parseApprovalRoles(value: string | null | undefined): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "none") return [];
  return trimmed
    .split(/,| and | & /i)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function AuthorityDelegationMemoDocument({
  clientName,
  businessName,
  submittedData,
  generatedDate,
  logoUrl,
}: {
  clientName: string;
  businessName: string;
  submittedData: Record<string, any>;
  generatedDate: string;
  logoUrl?: string | Buffer | null;
}) {
  const documentOwnerName = businessName || clientName;
  const delegateName = submittedData.delegate_name || "";
  const effectiveDate = formatDate(submittedData.effective_date) || generatedDate;
  const expirationDate = formatDate(submittedData.expiration_date);
  const authorityBasis = submittedData.authority_basis || "";
  const delegatedAuthority = submittedData.delegated_authority || "";
  const scope = submittedData.scope || "";
  const financialThreshold = submittedData.financial_threshold;
  const exclusions = submittedData.exclusions || "";
  const subDelegationAllowed = Boolean(submittedData.sub_delegation_allowed);
  const approvalRoles = parseApprovalRoles(submittedData.additional_approvals_required);
  const signature = submittedData.signature || clientName;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View>
          {logoUrl ? (
            <View style={styles.letterheadRow}>
              <Image src={logoUrl} style={styles.logoImage} />
              <Text style={styles.entityName} hyphenationCallback={noHyphen}>{documentOwnerName.toUpperCase()}</Text>
            </View>
          ) : (
            <Text style={styles.entityName} hyphenationCallback={noHyphen}>{documentOwnerName.toUpperCase()}</Text>
          )}
          <View style={styles.rule} />
        </View>

        <Text style={styles.caption} hyphenationCallback={noHyphen}>Authority Delegation Memorandum</Text>
        <Text style={styles.documentTitle} hyphenationCallback={noHyphen}>Delegation of Authority</Text>

        <View style={styles.memoHeader}>
          <View style={styles.memoRow}>
            <Text style={styles.memoLabel} hyphenationCallback={noHyphen}>To</Text>
            <Text style={styles.memoValue} hyphenationCallback={noHyphen}>{delegateName}</Text>
          </View>
          <View style={styles.memoRow}>
            <Text style={styles.memoLabel} hyphenationCallback={noHyphen}>From</Text>
            <Text style={styles.memoValue} hyphenationCallback={noHyphen}>{documentOwnerName}</Text>
          </View>
          <View style={styles.memoRow}>
            <Text style={styles.memoLabel} hyphenationCallback={noHyphen}>Effective</Text>
            <Text style={styles.memoValue} hyphenationCallback={noHyphen}>
              {effectiveDate}{expirationDate ? ` through ${expirationDate}` : ", until amended or revoked in writing"}
            </Text>
          </View>
        </View>

        <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
          This memorandum delegates limited authority to {delegateName || "the delegate named above"} on behalf of{" "}
          {documentOwnerName} (the &quot;Company&quot;), effective as of the date set forth above.
          {authorityBasis ? " This delegation is issued under " + toSentenceFragment(authorityBasis) + "." : ""}
        </Text>

        {delegatedAuthority ? (
          <View style={{ marginBottom: 14 }}>
            <Text style={styles.sectionLabel} hyphenationCallback={noHyphen}>Delegated Authority</Text>
            <Text style={styles.paragraph} hyphenationCallback={noHyphen}>{delegatedAuthority}</Text>
          </View>
        ) : null}

        {scope ? (
          <View style={{ marginBottom: 14 }}>
            <Text style={styles.sectionLabel} hyphenationCallback={noHyphen}>Scope</Text>
            <Text style={styles.paragraph} hyphenationCallback={noHyphen}>{scope}</Text>
          </View>
        ) : null}

        {financialThreshold ? (
          <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
            <Text style={styles.resolvedLabel} hyphenationCallback={noHyphen}>FINANCIAL LIMIT: </Text>
            This authority is limited to transactions not exceeding{" "}
            <Text style={{ fontWeight: "bold" }} hyphenationCallback={noHyphen}>{formatCurrency(financialThreshold)}</Text> per transaction.
          </Text>
        ) : null}

        {exclusions ? (
          <View style={{ marginBottom: 14 }}>
            <Text style={styles.sectionLabel} hyphenationCallback={noHyphen}>Exclusions</Text>
            <Text style={styles.paragraph} hyphenationCallback={noHyphen}>{exclusions}</Text>
          </View>
        ) : null}

        <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
          <Text style={styles.resolvedLabel} hyphenationCallback={noHyphen}>SUB-DELEGATION: </Text>
          {subDelegationAllowed
            ? `${delegateName || "The delegate"} may sub-delegate this authority only with the Company's prior written approval.`
            : `${delegateName || "The delegate"} may not sub-delegate this authority to any other individual.`}
        </Text>

        <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
          <Text style={styles.resolvedLabel} hyphenationCallback={noHyphen}>REVOCATION: </Text>
          This memorandum may be amended or revoked at any time by written notice from the Company, and supersedes
          any prior informal or written delegation that conflicts with its terms.
        </Text>

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureRole} hyphenationCallback={noHyphen}>Delegator</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureMeta} hyphenationCallback={noHyphen}>{signature}</Text>
          <Text style={[styles.signatureMeta, { marginTop: 10 }]} hyphenationCallback={noHyphen}>Dated {effectiveDate}</Text>
        </View>

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureRole} hyphenationCallback={noHyphen}>Delegate Acknowledgment</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureMeta} hyphenationCallback={noHyphen}>{delegateName}</Text>
          <Text style={[styles.signatureMeta, { marginTop: 10 }]} hyphenationCallback={noHyphen}>Dated</Text>
        </View>

        {approvalRoles.map((role) => (
          <View key={role} style={styles.signatureBlock}>
            <Text style={styles.signatureRole} hyphenationCallback={noHyphen}>Reviewed / Approved — {role}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureMeta} hyphenationCallback={noHyphen}>Dated</Text>
          </View>
        ))}

        <Footer />
      </Page>
    </Document>
  );
}
