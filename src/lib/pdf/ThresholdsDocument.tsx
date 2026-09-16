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

const noHyphen = (word: string) => [word];

const NAVY = "#0A0F2E";
const ROYAL = "#0B3DBF";
const STEEL = "#5B6472";
const HAIRLINE = "#D8DCE5";
const PALE = "#F4F6FA";

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
  documentTitle: { fontSize: 14, fontWeight: "bold", color: NAVY, textAlign: "center", marginBottom: 4 },
  adoptedLine: { fontSize: 10, color: STEEL, textAlign: "center", marginBottom: 22 },
  paragraph: { fontSize: 11, color: NAVY, marginBottom: 16, textAlign: "left" },
  resolvedLabel: { fontWeight: "bold" },
  table: { borderTop: `1 solid ${HAIRLINE}`, borderLeft: `1 solid ${HAIRLINE}`, marginBottom: 20 },
  headerRow: { flexDirection: "row", backgroundColor: PALE },
  headerCell: {
    flex: 1, fontSize: 9, fontWeight: "bold", color: ROYAL, textTransform: "uppercase",
    letterSpacing: 0.4, padding: 8, borderRight: `1 solid ${HAIRLINE}`, borderBottom: `1 solid ${HAIRLINE}`,
  },
  bodyRow: { flexDirection: "row" },
  bodyCell: {
    flex: 1, fontSize: 10, color: NAVY, padding: 8,
    borderRight: `1 solid ${HAIRLINE}`, borderBottom: `1 solid ${HAIRLINE}`,
  },
  signatureBlock: { marginTop: 32 },
  signatureLine: { borderBottom: `1 solid ${NAVY}`, width: 260, marginBottom: 4 },
  signatureMeta: { fontSize: 9, color: STEEL },
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

export function FinancialApprovalThresholdsDocument({
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
  const columns: string[] = ["Amount Range", "Approval Required", "Evidence Required", "Notes"];
  const rows: string[][] = submittedData.thresholds || [];

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

        <Text style={styles.caption} hyphenationCallback={noHyphen}>Financial Approval Thresholds</Text>
        <Text style={styles.documentTitle} hyphenationCallback={noHyphen}>Approval Thresholds of {documentOwnerName}</Text>
        <Text style={styles.adoptedLine} hyphenationCallback={noHyphen}>Adopted {generatedDate}</Text>

        <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
          The undersigned, being the duly authorized governing party of {documentOwnerName} (the &quot;Company&quot;),
          hereby adopts the following approval thresholds, effective as of the date set forth above. Each threshold
          band establishes who must approve a spend of that size, and what evidence the Company retains as proof of
          that approval.
        </Text>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            {columns.map((c) => (
              <Text key={c} style={styles.headerCell} hyphenationCallback={noHyphen}>{c}</Text>
            ))}
          </View>
          {rows.map((row, i) => (
            <View key={i} style={styles.bodyRow}>
              {row.map((cell, j) => (
                <Text key={j} style={styles.bodyCell} hyphenationCallback={noHyphen}>{cell}</Text>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
          <Text style={styles.resolvedLabel} hyphenationCallback={noHyphen}>FURTHER RESOLVED, </Text>
          that any spend falling outside a defined band shall be treated at the next higher approval level until this
          schedule is amended, and that this schedule shall remain in full force and effect until amended,
          superseded, or revoked by a subsequent resolution duly adopted in accordance with the Company&apos;s
          governing documents.
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
