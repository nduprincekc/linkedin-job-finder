// Privacy Policy and Terms of Service content. Edit the CONFIG block, everything else reads from it.
// Not legal advice — have a Nigerian lawyer review before charging money.

export const LEGAL_CONFIG = {
  appName: "LinkedIn Job Finder",
  company: "KCEMMA HUB (RC 9602233)",
  address: "Lagos, Nigeria",
  contactEmail: "privacy@kcemmahub.com",     // change to a real inbox you check
  effectiveDate: "6 September 2026",
  version: "1.0",
  founder: "Kenechukwu Emmanuel Nduaguba",
  founderTitle: "Founder & CEO",
  founderLinkedIn: "https://www.linkedin.com/in/nduagubakc",
  supportEmail: "support@kcemmahub.com",
  feedbackEmail: "feedback@kcemmahub.com",
  whatsapp: "2348120026492",            // digits only, country code first — used to build wa.me links
  whatsappDisplay: "+234 812 002 6492"
};

const C = LEGAL_CONFIG;

export const PRIVACY = {
  title: "Privacy Policy",
  intro: `${C.company} ("we", "us") operates ${C.appName} (the "Service"). This policy explains what personal data we collect, why, who we share it with, and the rights you have under the Nigeria Data Protection Act 2023 (NDPA) and, where it applies, the EU/UK GDPR. Effective ${C.effectiveDate} (v${C.version}).`,
  sections: [
    ["What we collect", [
      "Account data: your name, email address, phone number and a hashed password (we never see the password itself). Your phone number is used to send job alerts by WhatsApp if you opt in, and to reach you about your account. We never call you, sell it, or share it with employers or advertisers.",
      "Usage data: the searches you run (keywords, location, country and filters), jobs you save, notes and application status you add, CSV exports you make, and alerts you create (including the email address or Telegram chat ID you choose for delivery).",
      "Technical data: IP address, browser type and timestamps, kept in our server and authentication logs for security and abuse prevention.",
      "Preferences stored in your browser (localStorage): rows-per-page, cached search results, and — if you use the Service without an account — your saved jobs and history. These never leave your device.",
      "We do not collect payment card details ourselves. If we introduce paid plans, payments will be processed by Paystack or Stripe, who handle card data under their own policies."
    ]],
    ["Why we use it (legal bases)", [
      "To provide the Service: run your searches, store your saved jobs, deliver your alerts. (Performance of our contract with you.)",
      "To keep the Service secure and fair: verify your session, enforce daily search limits and alert caps, detect abuse. (Legitimate interest.)",
      "To communicate with you: confirmation, password-reset and alert emails, and occasional product updates you can opt out of. (Contract / consent.)",
      "To improve the Service: aggregated, anonymised statistics such as most-searched keywords. Never sold, never used for advertising. (Legitimate interest.)"
    ]],
    ["Who we share it with", [
      "Supabase (database, authentication and email delivery of auth messages) — hosted in the region shown in your account settings.",
      "n8n on our own servers (Amazon Web Services) — runs your searches and sends alerts.",
      "Apify — receives only your search parameters (keywords, location, country, filters), never your identity, to fetch public job listings.",
      "Email and messaging providers (our email provider, and Twilio/WhatsApp or Telegram if you choose those channels) — receive only the address, phone number or chat ID you gave us, and the alert content.",
      "Law enforcement or regulators, only where legally required.",
      "We do not sell personal data and we do not share it with advertisers."
    ]],
    ["Job listing data and LinkedIn", [
      "Job listings shown in the Service are publicly available postings collected from LinkedIn through a third-party data provider. We are not affiliated with, endorsed by, or acting on behalf of LinkedIn Corporation.",
      "We never access your LinkedIn account, never post, apply or message on your behalf, and never ask for your LinkedIn credentials.",
      "Company names and job details belong to the respective employers. Applying to a job takes you to LinkedIn or the employer's site, whose own privacy terms then apply."
    ]],
    ["How long we keep it", [
      "Account data: until you delete your account.",
      "Search history: 12 months, then deleted or anonymised.",
      "Alert delivery records (which jobs were sent to you): while the alert exists, plus 30 days.",
      "Server and authentication logs: 90 days.",
      "Cached search results in your browser: 30 minutes by default; you can clear them at any time."
    ]],
    ["Your rights", [
      "Access, correct or export your data — from Settings, or by emailing us.",
      "Delete your account and all associated data yourself from Settings → Account → Delete my account. Deletion is immediate and permanent.",
      "Withdraw consent for emails or WhatsApp messages at any time using the unsubscribe link, by turning off WhatsApp alerts in Settings, or by pausing/deleting alerts.",
      "Object to, or ask us to restrict, processing based on legitimate interest.",
      "Complain to the Nigeria Data Protection Commission (ndpc.gov.ng) or your local supervisory authority if you believe we have mishandled your data."
    ]],
    ["Security", [
      "Data is encrypted in transit (HTTPS) and at rest. Passwords are hashed. Each user can only access their own rows (database row-level security).",
      "Secrets and API keys are never sent to your browser.",
      "No system is perfectly secure. If a breach affecting your data occurs, we will notify you and the relevant authority within 72 hours of becoming aware, as the NDPA requires."
    ]],
    ["Children", [
      "The Service is for people aged 18 and over. We do not knowingly collect data from anyone under 18; if you believe we have, contact us and we will delete it."
    ]],
    ["International transfers", [
      "Our providers may store data outside Nigeria (for example in the EU or US). Where they do, we rely on their standard contractual protections and the NDPA's adequacy provisions."
    ]],
    ["Changes and contact", [
      `We will post any material changes here and, for significant changes, email you. Questions or requests: ${C.contactEmail}, ${C.company}, ${C.address}.`
    ]]
  ]
};

export const TERMS = {
  title: "Terms of Service",
  intro: `These terms govern your use of ${C.appName}, provided by ${C.company}. By creating an account you agree to them. Effective ${C.effectiveDate} (v${C.version}).`,
  sections: [
    ["The Service", [
      "We provide a tool to search publicly available job listings, save them, export them and receive alerts about new ones. We do not employ, recruit, or guarantee any job, interview or response from any employer.",
      "Listings are collected from third-party sources and may be delayed, incomplete, or removed by the original poster. We make no warranty as to their accuracy."
    ]],
    ["Your account", [
      "You must be 18 or older and provide accurate information. You are responsible for keeping your password secure and for activity under your account.",
      "One account per person. Free-plan limits (searches per day, number of alerts) are enforced automatically; creating multiple accounts to evade them is a breach of these terms."
    ]],
    ["Acceptable use", [
      "Do not use the Service to scrape, resell or redistribute listing data, to send unsolicited messages, or to interfere with the Service or other users.",
      "Do not attempt to access other users' data, bypass rate limits, or probe our systems. We may suspend or terminate accounts that do."
    ]],
    ["Paid plans (when available)", [
      "Prices are shown before you pay. Subscriptions renew automatically until cancelled; you can cancel any time and keep access until the end of the paid period. Refunds are handled case by case within 7 days of a charge."
    ]],
    ["Intellectual property", [
      "The Service's software, design and branding are ours. Job listings and company names belong to their respective owners. You may use exported data for your personal job search only."
    ]],
    ["Availability and liability", [
      "The Service is provided 'as is'. Because we depend on third-party data sources, we may pause or change features without notice. To the extent permitted by law, our total liability to you is limited to the amount you paid us in the 12 months before the claim, and we are not liable for lost opportunities, lost income or indirect losses."
    ]],
    ["Termination", [
      "You can delete your account at any time from Settings. We may terminate accounts that breach these terms. Sections on liability and intellectual property survive termination."
    ]],
    ["Governing law", [
      `These terms are governed by the laws of the Federal Republic of Nigeria. Disputes go to the courts of Lagos State. Contact: ${C.contactEmail}.`
    ]]
  ]
};