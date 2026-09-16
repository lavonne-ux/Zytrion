import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";

Font.register({
  family: "Carlito",
  fonts: [
    { src: "./fonts/Carlito-Regular.ttf", fontWeight: "normal", fontStyle: "normal" },
    { src: "./fonts/Carlito-Bold.ttf", fontWeight: "bold", fontStyle: "normal" },
    { src: "./fonts/Carlito-Italic.ttf", fontWeight: "normal", fontStyle: "italic" },
    { src: "./fonts/Carlito-BoldItalic.ttf", fontWeight: "bold", fontStyle: "italic" },
  ],
});

// A legal instrument must never break a word with an inserted hyphen, react-pdf's
// default hyphenation engine will otherwise do this on justified text (e.g. a
// surname wrapping mid-word as "Michaels-"). The global Font.registerHyphenationCallback
// does not reach the renderer's internal FontStore instance, so it must be passed as a
// prop directly on every multi-line Text node instead.
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
  entityName: {
    fontSize: 9,
    fontWeight: "bold",
    color: ROYAL,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  letterheadRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  logoImage: {
    width: 28,
    height: 28,
    marginRight: 10,
    objectFit: "contain",
  },
  title: {
    fontSize: 19,
    fontWeight: "bold",
    color: NAVY,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10.5,
    color: STEEL,
    marginBottom: 18,
  },
  rule: {
    borderBottom: `1.5 solid ${ROYAL}`,
    marginBottom: 22,
  },
  caption: {
    fontSize: 9,
    fontWeight: "bold",
    color: STEEL,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 4,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: NAVY,
    textAlign: "center",
    marginBottom: 4,
  },
  adoptedLine: {
    fontSize: 10,
    color: STEEL,
    textAlign: "center",
    marginBottom: 22,
  },
  paragraph: {
    fontSize: 11,
    color: NAVY,
    marginBottom: 12,
    textAlign: "left",
  },
  resolvedLabel: {
    fontWeight: "bold",
  },
  officerTable: {
    marginTop: 6,
    marginBottom: 14,
    borderTop: `1 solid ${HAIRLINE}`,
  },
  officerRow: {
    flexDirection: "row",
    borderBottom: `1 solid ${HAIRLINE}`,
    paddingVertical: 7,
  },
  officerCellName: {
    flex: 1.4,
    fontSize: 11,
    fontWeight: "bold",
    color: NAVY,
  },
  officerCellTitle: {
    flex: 1,
    fontSize: 11,
    color: STEEL,
  },
  signatureBlock: {
    marginTop: 40,
  },
  signatureLine: {
    borderBottom: `1 solid ${NAVY}`,
    width: 260,
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 12,
    fontFamily: "Carlito",
    fontStyle: "italic",
    marginBottom: 2,
  },
  signatureMeta: {
    fontSize: 9,
    color: STEEL,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 60,
    right: 60,
    fontSize: 8,
    color: "#9AA1AD",
    textAlign: "center",
    borderTop: `1 solid ${HAIRLINE}`,
    paddingTop: 8,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 60,
    fontSize: 8,
    color: "#9AA1AD",
  },
});

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatCurrency(value: string | number): string {
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  if (isNaN(n)) return String(value);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function Letterhead({ documentOwnerName, logoUrl }: { documentOwnerName: string; logoUrl?: string | null }) {
  return (
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
  );
}

function Footer() {
  return (
    <Text style={styles.footer} fixed hyphenationCallback={noHyphen}>
      Prepared using the Zytrion Governance Standard. This document does not constitute legal advice; consult
      qualified counsel before relying on it for a governance or tax decision.
      {"\n"}© {new Date().getFullYear()} Zytrion Infrastructure Group, Inc. All rights reserved.
    </Text>
  );
}

export function OrganizationalResolutionDocument({
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
  logoUrl?: string | null;
}) {
  const documentOwnerName = businessName || clientName;
  const entityName = submittedData.entity_legal_name || documentOwnerName;
  const resolutionDate = formatDate(submittedData.resolution_date) || generatedDate;
  const authoritySummary = submittedData.governing_authority_summary || "";
  const officers: { Name: string; Title: string }[] = submittedData.officer_name_title || [];
  const signature = submittedData.signature || "";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Letterhead documentOwnerName={documentOwnerName} logoUrl={logoUrl} />

        <Text style={styles.caption} hyphenationCallback={noHyphen}>Organizational Resolution</Text>
        <Text style={styles.documentTitle} hyphenationCallback={noHyphen}>Resolution of {entityName}</Text>
        <Text style={styles.adoptedLine} hyphenationCallback={noHyphen}>Adopted {resolutionDate}</Text>

        <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
          The undersigned, being the duly authorized governing party of {entityName} (the &quot;Company&quot;), hereby
          adopts the following resolutions effective as of the date set forth above.
        </Text>

        <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
          <Text style={styles.resolvedLabel} hyphenationCallback={noHyphen}>WHEREAS, </Text>
          the Company recognizes the need to establish a clear and documented governance structure consistent with
          sound business practice; and
        </Text>

        {authoritySummary ? (
          <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
            <Text style={styles.resolvedLabel} hyphenationCallback={noHyphen}>WHEREAS, </Text>
            {authoritySummary.charAt(0).toLowerCase() + authoritySummary.slice(1)}
          </Text>
        ) : null}

        <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
          <Text style={styles.resolvedLabel} hyphenationCallback={noHyphen}>NOW, THEREFORE, BE IT RESOLVED, </Text>
          that the following individual(s) are hereby confirmed as duly authorized officer(s) of the Company, with
          the titles set forth opposite their names:
        </Text>

        <View style={styles.officerTable}>
          {officers.map((row, i) => (
            <View key={i} style={styles.officerRow}>
              <Text style={styles.officerCellName} hyphenationCallback={noHyphen}>{row.Name}</Text>
              <Text style={styles.officerCellTitle} hyphenationCallback={noHyphen}>{row.Title}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
          <Text style={styles.resolvedLabel} hyphenationCallback={noHyphen}>FURTHER RESOLVED, </Text>
          that this resolution shall remain in full force and effect until amended, superseded, or revoked by a
          subsequent resolution duly adopted in accordance with the Company&apos;s governing documents.
        </Text>

        <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
          IN WITNESS WHEREOF, the undersigned has executed this resolution as of the date first written above.
        </Text>

        <View style={styles.signatureBlock}>
          <Text style={[styles.signatureName, { marginBottom: 14 }]} hyphenationCallback={noHyphen}>&nbsp;</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName} hyphenationCallback={noHyphen}>{signature}</Text>
          <Text style={styles.signatureMeta} hyphenationCallback={noHyphen}>Signed and dated {resolutionDate}</Text>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}

export function CompensationDistributionResolutionDocument({
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
  logoUrl?: string | null;
}) {
  const documentOwnerName = businessName || clientName;
  const method: string = submittedData.method || "";
  const rows: any[] = submittedData.distribution_resolution || [];

  const isDistribution = method === "Owner distributions";
  const isPayroll = method === "Payroll salary";
  const isContracted = method === "Contracted payments";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Letterhead documentOwnerName={documentOwnerName} logoUrl={logoUrl} />

        <Text style={styles.caption} hyphenationCallback={noHyphen}>Compensation and Distribution Resolution</Text>
        <Text style={styles.documentTitle} hyphenationCallback={noHyphen}>Resolution of {documentOwnerName}</Text>
        <Text style={styles.adoptedLine} hyphenationCallback={noHyphen}>Adopted {generatedDate}</Text>

        <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
          The undersigned, being the duly authorized governing party of {documentOwnerName} (the &quot;Company&quot;),
          hereby adopts the following resolution regarding owner compensation, effective as of the date set forth
          above.
        </Text>

        {isPayroll && (
          <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
            <Text style={styles.resolvedLabel} hyphenationCallback={noHyphen}>RESOLVED, </Text>
            that owner compensation shall be paid through the Company&apos;s payroll system as salary, subject to
            standard federal and state tax withholding at the time of each payment. This method applies to an owner
            actively working in the business and is treated as ordinary W-2 wage income.
          </Text>
        )}

        {isContracted && (
          <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
            <Text style={styles.resolvedLabel} hyphenationCallback={noHyphen}>RESOLVED, </Text>
            that the individual(s) named in this resolution shall be compensated as independent contractors, not as
            employees of the Company, and shall be issued the applicable year-end tax reporting document. The
            Company confirms this classification reflects the actual nature of the working relationship.
          </Text>
        )}

        {isDistribution &&
          rows.map((row, i) => (
            <Text key={i} style={styles.paragraph} hyphenationCallback={noHyphen}>
              <Text style={styles.resolvedLabel} hyphenationCallback={noHyphen}>RESOLVED, </Text>
              that the Company hereby authorizes a distribution in the amount of{" "}
              <Text style={{ fontWeight: "bold" }} hyphenationCallback={noHyphen}>{formatCurrency(row.amount)}</Text> to{" "}
              <Text style={{ fontWeight: "bold" }} hyphenationCallback={noHyphen}>{row.recipients}</Text>, dated {formatDate(row.date)}, approved
              via {row.approval_method}.{" "}
              {row.tax_confirmation
                ? "The undersigned confirms that the applicable tax treatment for this distribution has been reviewed and is appropriate for the Company's entity structure."
                : "Tax treatment for this distribution has not yet been confirmed and should be reviewed with the Company's accountant before funds are released."}
            </Text>
          ))}

        <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
          <Text style={styles.resolvedLabel} hyphenationCallback={noHyphen}>FURTHER RESOLVED, </Text>
          that this resolution shall remain in full force and effect until amended, superseded, or revoked by a
          subsequent resolution duly adopted in accordance with the Company&apos;s governing documents.
        </Text>

        <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
          IN WITNESS WHEREOF, the undersigned has executed this resolution as of the date first written above.
        </Text>

        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureMeta} hyphenationCallback={noHyphen}>Signature</Text>
          <Text style={[styles.signatureMeta, { marginTop: 10 }]} hyphenationCallback={noHyphen}>Dated {generatedDate}</Text>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}
