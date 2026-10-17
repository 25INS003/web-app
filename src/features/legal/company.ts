/**
 * The business details the legal and support pages quote.
 *
 * One place on purpose: the privacy policy, terms, refund policy, support and
 * account-deletion pages all name the same company, inbox and grievance
 * officer, and a detail that has to be changed in five files is one that ends
 * up different in two of them.
 *
 * A `null` value renders as a visible, highlighted placeholder (the `label`)
 * rather than as nothing, so an unfilled detail cannot pass for a filled one.
 * Fill these in before the pages are relied on.
 */
export const COMPANY = {
  legalName: { value: "Nagi Traders", label: "[COMPANY LEGAL NAME]" },
  registeredAddress: {
    value:
      "H.No. 201/3 Ext., Vasant Vihar, Trikuta Nagar, Jammu, Jammu and Kashmir",
    label: "[REGISTERED OFFICE ADDRESS]",
  },
  supportEmail: { value: "storenedyway@gmail.com", label: "[SUPPORT EMAIL]" },
  supportPhone: { value: "+91 90860 80040", label: "[SUPPORT PHONE]" },
  supportHours: {
    value: "9am–5pm IST",
    label: "[SUPPORT HOURS, e.g. 9am–9pm IST, all days]",
  },
  grievanceOfficerName: {
    value: "Navjot Singh",
    label: "[GRIEVANCE OFFICER NAME]",
  },
  grievanceOfficerEmail: {
    value: "storenedyway@gmail.com",
    label: "[GRIEVANCE OFFICER EMAIL]",
  },
  jurisdictionCity: {
    value: "Jammu",
    label: "[CITY FOR COURTS' JURISDICTION]",
  },
  issueReportWindow: {
    value: "48 hours of delivery",
    label: "[TIME TO REPORT A PROBLEM, e.g. 48 hours of delivery]",
  },
  refundMethod: {
    value: "UPI or bank transfer",
    label: "[HOW CASH-ON-DELIVERY REFUNDS ARE PAID, e.g. UPI or bank transfer]",
  },
  refundTimeline: {
    value: "5–7 business days",
    label: "[REFUND TIMELINE, e.g. 5–7 business days]",
  },
  deletionTimeline: {
    value: "within 30 days",
    label: "[DELETION TIMELINE, e.g. within 30 days]",
  },
} satisfies Record<string, { value: string | null; label: string }>;

export type CompanyField = keyof typeof COMPANY;

/** The date shown as "Last updated" on every legal page. */
export const LEGAL_LAST_UPDATED = "17 October 2026";
