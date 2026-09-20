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
  documentTitle: { fontSize: 14, fontWeight: "bold", color: NAVY, textAlign: "center", marginBottom: 4 },
  adoptedLine: { fontSize: 10, color: STEEL, textAlign: "center", marginBottom: 22 },
  paragraph: { fontSize: 11, color: NAVY, marginBottom: 16, textAlign: "left" },
  resolvedLabel: { fontWeight: "bold" },
  fieldBlock: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 9, fontWeight: "bold", color: ROYAL, textTransform: "uppercase",
    letterSpacing: 0.6, marginBottom: 5,
  },
  fieldValue: { fontSize: 11, color: NAVY, lineHeight: 1.5 },
  reviewRow: {
    flexDirection: "row", borderTop: `1 solid ${HAIRLINE}`, borderBottom: `1 solid ${HAIRLINE}`,
    paddingVertical: 10, marginBottom: 20,
  },
  reviewLabel: { fontSize: 9, fontWeight: "bold", color: STEEL, textTransform: "uppercase", letterSpacing: 0.6 },
  reviewValue: { fontSize: 11, fontWeight: "bold", color: NAVY, marginTop: 2 },
  signatureBlock: { marginTop: 24 },
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

export function RoleAccountabilityStandardDocument({
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
  const roleName = submittedData.role_name || "the Role";
  const performanceStandard = submittedData.performance_standard || "";
  const escalationRule = submittedData.escalation_rule || "";
  const reviewFrequency = submittedData.review_frequency || "Quarterly";

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

        <Text style={styles.caption} hyphenationCallback={noHyphen}>Role Accountability Standard</Text>
        <Text style={styles.documentTitle} hyphenationCallback={noHyphen}>Accountability Standard for {roleName}</Text>
        <Text style={styles.adoptedLine} hyphenationCallback={noHyphen}>Adopted {generatedDate}</Text>

        <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
          The undersigned, being the duly authorized governing party of {documentOwnerName} (the &quot;Company&quot;),
          hereby adopts the following accountability standard for the role of {roleName}, effective as of the date
          set forth above. This standard applies to the role itself, independent of the individual currently holding
          it.
        </Text>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel} hyphenationCallback={noHyphen}>Performance Standard</Text>
          <Text style={styles.fieldValue} hyphenationCallback={noHyphen}>{performanceStandard}</Text>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel} hyphenationCallback={noHyphen}>Escalation Rule</Text>
          <Text style={styles.fieldValue} hyphenationCallback={noHyphen}>{escalationRule}</Text>
        </View>

        <View style={styles.reviewRow}>
          <View>
            <Text style={styles.reviewLabel} hyphenationCallback={noHyphen}>Review Frequency</Text>
            <Text style={styles.reviewValue} hyphenationCallback={noHyphen}>{reviewFrequency}</Text>
          </View>
        </View>

        <Text style={styles.paragraph} hyphenationCallback={noHyphen}>
          <Text style={styles.resolvedLabel} hyphenationCallback={noHyphen}>FURTHER RESOLVED, </Text>
          that the person holding the role of {roleName} shall be evaluated against this standard on the frequency
          stated above, that failure to meet this standard shall trigger the escalation rule stated above, and that
          this standard shall remain in full force and effect until amended, superseded, or revoked by a subsequent
          resolution duly adopted in accordance with the Company&apos;s governing documents.
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
