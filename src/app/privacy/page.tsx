import Link from "next/link";

const PRIVACY_EFFECTIVE_DATE = "2026-08-21";

type Block =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "bullets"; items: string[] };

type LegalSection = { heading: string; blocks: Block[] };

const SECTIONS: LegalSection[] = [
  {
    heading: "Introduction",
    blocks: [
      {
        type: "p",
        text: "Zytrion Infrastructure Group, Inc., a Georgia corporation (referred to throughout this policy as \u201CZytrion,\u201D \u201Cwe,\u201D \u201Cus,\u201D or \u201Cour\u201D), operates the website www.getzytrion.com and related diagnostics, tools, and services. This Privacy Policy explains how we collect, use, store, and protect your personal information when you interact with our website, complete GRID or ZAID, purchase products or services, or communicate with us in any capacity.",
      },
      {
        type: "p",
        text: "By accessing our website or using any of our services, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with the practices described here, please do not use our services.",
      },
    ],
  },
  {
    heading: "Information We Collect",
    blocks: [
      { type: "h3", text: "Information You Provide Directly" },
      {
        type: "p",
        text: "When you interact with our website, complete a diagnostic, make a purchase, or communicate with us, we may collect the following information: your full name, email address, phone number, company or business name, business structure and organizational stage, responses to GRID, ZAID, or any other Zytrion diagnostic, payment information processed through our third-party payment provider (Stripe), and any other information you voluntarily provide through forms, emails, or other communications.",
      },
      { type: "h3", text: "Information Collected Automatically" },
      {
        type: "p",
        text: "When you visit our website, certain information is collected automatically, including your IP address, browser type and version, operating system, referring URL, pages visited and time spent on each page, and device identifiers.",
      },
      { type: "h3", text: "Diagnostic Data" },
      {
        type: "p",
        text: "When you complete GRID, ZAID, or any other Zytrion diagnostic, we collect your responses to each statement or question. This data is used to calculate your readiness score, assign your tier placement, identify your weakest pillar, and deliver your personalized results. Your diagnostic data is stored securely and is associated with your contact information for the purpose of delivering results and follow-up services.",
      },
    ],
  },
  {
    heading: "How We Use Your Information",
    blocks: [
      {
        type: "p",
        text: "We use the information we collect to deliver and process your diagnostic results, to communicate your tier placement and recommended next steps, to process payments and deliver purchased products and services, to send transactional emails related to your purchases and results, to improve our diagnostic tools, services, and website functionality, to respond to your inquiries and provide customer support, to maintain internal records, and to comply with legal obligations and protect our rights.",
      },
      {
        type: "p",
        text: "We do not sell, rent, or trade your personal information to third parties for marketing purposes.",
      },
    ],
  },
  {
    heading: "Third-Party Service Providers",
    blocks: [
      {
        type: "p",
        text: "Stripe processes all payment transactions. We do not store your credit card information on our servers.",
      },
      {
        type: "p",
        text: "Resend manages our transactional email communications. Supabase manages our contact and client records and processes your diagnostic data through automated workflows. Vercel hosts and connects our platforms. Notion serves as our internal database for record-keeping purposes.",
      },
      {
        type: "p",
        text: "We require all third-party providers to maintain appropriate security measures and to process your information only as necessary to perform services on our behalf.",
      },
    ],
  },
  {
    heading: "Data Retention",
    blocks: [
      {
        type: "p",
        text: "We retain your personal information and diagnostic data for as long as necessary to fulfill the purposes described in this policy, to maintain our business records, to comply with legal obligations, and to resolve disputes. If you request deletion of your data, we will honor that request within 30 days, subject to any legal retention requirements.",
      },
    ],
  },
  {
    heading: "Data Security",
    blocks: [
      {
        type: "p",
        text: "We implement reasonable administrative, technical, and physical security measures to protect your personal information. However, no method of transmission over the internet or method of electronic storage is completely secure, and we cannot guarantee absolute security.",
      },
    ],
  },
  {
    heading: "Your Rights",
    blocks: [
      {
        type: "p",
        text: "Depending on your location, you may have the right to access the personal information we hold about you, request correction of inaccurate information, request deletion of your personal information, object to or restrict certain processing, and request a copy of your information in a portable format. To exercise any of these rights, contact us at info@getzytrion.com. We will respond within 30 days.",
      },
    ],
  },
  {
    heading: "Children's Privacy",
    blocks: [
      {
        type: "p",
        text: "Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child under 18, we will take steps to delete that information promptly.",
      },
    ],
  },
  {
    heading: "Changes to This Policy",
    blocks: [
      {
        type: "p",
        text: "We may update this Privacy Policy from time to time. The effective date at the top of this page indicates when the policy was last revised.",
      },
    ],
  },
  {
    heading: "Contact Information",
    blocks: [
      {
        type: "p",
        text: "If you have questions about this Privacy Policy, contact us at Zytrion Infrastructure Group, Inc., info@getzytrion.com, www.getzytrion.com.",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zy-near-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-zy-light-blue hover:text-white">
          &larr; Back to getzytrion.com
        </Link>

        <h1 className="text-3xl font-semibold mt-6 mb-2">Privacy Policy</h1>
        <p className="text-sm text-zy-chrome/70 mb-12">
          Effective Date: {PRIVACY_EFFECTIVE_DATE}
        </p>

        {SECTIONS.map((section) => (
          <div key={section.heading} className="mb-10">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-white/10">
              {section.heading}
            </h2>
            {section.blocks.map((block, i) => {
              if (block.type === "h3") {
                return (
                  <h3 key={i} className="text-white font-semibold italic mt-4 mb-2">
                    {block.text}
                  </h3>
                );
              }
              if (block.type === "bullets") {
                return (
                  <ul key={i} className="list-disc pl-6 space-y-2 mb-4 text-zy-chrome">
                    {block.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={i} className="text-zy-chrome leading-relaxed mb-4">
                  {block.text}
                </p>
              );
            })}
          </div>
        ))}
      </div>
    </main>
  );
}
