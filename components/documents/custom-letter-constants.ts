export type SectionType = "PARAGRAPH" | "KEY_VALUE" | "BULLETS" | "CALLOUT";

export interface KeyValueItem {
  id: string;
  label: string;
  value: string;
}

export interface CustomLetterSection {
  id: string;
  heading?: string;
  paragraph?: string;
  type?: SectionType;
  bulletPoints?: string[];
  keyValues?: KeyValueItem[];
  isHighlight?: boolean;
}

export interface CustomLetterDocumentData {
  id: string;
  refNumber: string;
  docTitle: string;
  date: string;
  status: "DRAFT" | "ISSUED" | "ACTIVE";

  addressee: string;
  addresseeSubtitle?: string;
  subject: string;
  salutation: string;

  sections: CustomLetterSection[];

  closingText?: string;
  signatoryCompany: string;
  signatoryTitle: string;
  signatoryName: string;
  signatoryDesignation: string;
  showStampAndSignature: boolean;
  companyStampUrl?: string;
  signatorySignatureUrl?: string;

  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: {
    id?: string;
    fullName?: string;
    email?: string;
  };
}

export interface LetterPreset {
  id: string;
  name: string;
  description: string;
  category:
    "Salary & Finance" | "HR & Service" | "Compliance & NOC" | "Administrative";
  data: Omit<
    CustomLetterDocumentData,
    "id" | "refNumber" | "createdAt" | "updatedAt"
  >;
}

export const LETTER_PRESETS: LetterPreset[] = [
  {
    id: "salary-certificate",
    name: "Salary Certificate (Bank & Embassy)",
    description:
      "Standard UAE salary verification letter with complete compensation breakdown.",
    category: "Salary & Finance",
    data: {
      docTitle: "SALARY CERTIFICATE",
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: "ISSUED",
      addressee: "To Whom It May Concern,",
      addresseeSubtitle: "Dubai, United Arab Emirates",
      subject: "Subject: Salary & Employment Verification Certificate",
      salutation: "Dear Sir / Madam,",
      sections: [
        {
          id: "sec-sal-1",
          heading: "Employment Verification",
          paragraph:
            "This is to certify that Mr. Mohamed Said Abdelsamie Abdelwahab, holding Emirates ID 784-1994-1500490-4, is a bonafide permanent employee of AGM Fitout Technical Services LLC, working in our organization since 30/04/2024 as Senior Project Engineer.",
          type: "PARAGRAPH",
        },
        {
          id: "sec-sal-2",
          heading: "Monthly Remuneration Breakdown",
          type: "KEY_VALUE",
          keyValues: [
            { id: "kv-1", label: "Basic Salary", value: "AED 8,500.00" },
            { id: "kv-2", label: "Housing Allowance", value: "AED 4,000.00" },
            {
              id: "kv-3",
              label: "Transport & Fuel Allowance",
              value: "AED 1,500.00",
            },
            {
              id: "kv-4",
              label: "Total Gross Monthly Salary",
              value: "AED 14,000.00 (Fourteen Thousand Dirhams Only)",
            },
          ],
        },
        {
          id: "sec-sal-3",
          heading: "Terms & Conditions",
          paragraph:
            "The employee's salary is paid regularly through the UAE Wages Protection System (WPS) at the end of each calendar month. The employee continues to be on the active payroll of the company under an unlimited employment contract.",
          type: "PARAGRAPH",
        },
      ],
      closingText:
        "This certificate is issued upon the request of the employee for banking / official purposes without any financial or legal liability on the part of AGM Fitout Technical Services LLC. This document is electronically system-generated.",
      signatoryCompany: "AGM Fitout Technical Services LLC",
      signatoryTitle: "Authorized Signatory,",
      signatoryName: "Zeeshan Ahmad",
      signatoryDesignation: "Head of Accounts & Finance",
      showStampAndSignature: true,
    },
  },
  {
    id: "experience-certificate",
    name: "Experience & Relieving Certificate",
    description:
      "Official service certificate detailing employee tenure, designation, and conduct.",
    category: "HR & Service",
    data: {
      docTitle: "EXPERIENCE & SERVICE CERTIFICATE",
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: "ISSUED",
      addressee: "TO WHOM IT MAY CONCERN",
      addresseeSubtitle: "United Arab Emirates",
      subject: "Subject: Work Experience & Service Confirmation",
      salutation: "To Whom It May Concern,",
      sections: [
        {
          id: "sec-exp-1",
          heading: "Tenure & Designation",
          paragraph:
            "This is to certify that Mr. Ahmed Mansoor, holder of Passport No. N7829103 and Emirates ID 784-1988-3490129-1, was employed with AGM Fitout Technical Services LLC from 15th January 2022 to 31st August 2025. During his tenure with us, he served as Senior Interior Fitout Site Supervisor.",
          type: "PARAGRAPH",
        },
        {
          id: "sec-exp-2",
          heading: "Key Roles & Responsibilities Handled",
          type: "BULLETS",
          bulletPoints: [
            "Supervision of high-end commercial and residential interior fitout executions across Dubai and Abu Dhabi.",
            "Coordination with MEP contractors, architects, local authorities (Civil Defense, Municipality), and project consultants.",
            "Strict implementation of site safety regulations, quality assurance benchmarks, and project handover schedules.",
            "Resource allocation, materials procurement verification, and site workforce leadership.",
          ],
        },
        {
          id: "sec-exp-3",
          heading: "Conduct & Performance Appraisal",
          paragraph:
            "During his period of service, we found him to be diligent, hardworking, trustworthy, and dedicated to achieving the highest standards of workmanship. He was relieved of his duties upon mutual consent with all accounts duly settled.",
          type: "PARAGRAPH",
        },
      ],
      closingText:
        "We thank him for his contributions to AGM Fitout Technical Services LLC and wish him all success in his future personal and professional endeavors.",
      signatoryCompany: "AGM Fitout Technical Services LLC",
      signatoryTitle: "Authorized Signatory,",
      signatoryName: "Assem Al-Khatib",
      signatoryDesignation: "Managing Director / Operations",
      showStampAndSignature: true,
    },
  },
  {
    id: "noc-letter",
    name: "No Objection Certificate (NOC)",
    description:
      "Official NOC for UAE Driving License, Travel, Visa, or External Training.",
    category: "Compliance & NOC",
    data: {
      docTitle: "NO OBJECTION CERTIFICATE (NOC)",
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: "ISSUED",
      addressee: "The Licensing Authority / Roads & Transport Authority (RTA)",
      addresseeSubtitle: "Government of Dubai, United Arab Emirates",
      subject:
        "Subject: No Objection Certificate for Obtaining UAE Driving License",
      salutation: "Respected Sir / Madam,",
      sections: [
        {
          id: "sec-noc-1",
          heading: "Employee & Employment Details",
          paragraph:
            "This is to certify that Mr. Tariq Mahmood, an Indian national holding Passport No. Z9821430 and Emirates ID 784-1992-9182341-3, is currently employed with AGM Fitout Technical Services LLC as Civil Estimator & Technical Draughtsman.",
          type: "PARAGRAPH",
        },
        {
          id: "sec-noc-2",
          heading: "Certificate of No Objection",
          paragraph:
            "We hereby confirm that AGM Fitout Technical Services LLC has NO OBJECTION whatsoever to Mr. Tariq Mahmood applying for and obtaining a Light Motor Vehicle Driving License from the Roads & Transport Authority (RTA) / approved driving institutes in Dubai.",
          type: "CALLOUT",
          isHighlight: true,
        },
        {
          id: "sec-noc-3",
          heading: "Validity & Scope",
          paragraph:
            "This NOC is issued exclusively for the purpose of driver licensing procedures and carries no financial guarantees or obligations upon the company.",
          type: "PARAGRAPH",
        },
      ],
      closingText:
        "Please feel free to contact our administrative offices at info@agmfitout.com or +971 48 749839 should you require any additional verification.",
      signatoryCompany: "AGM Fitout Technical Services LLC",
      signatoryTitle: "Authorized Signatory,",
      signatoryName: "Zeeshan Ahmad",
      signatoryDesignation: "Human Resources & Administration",
      showStampAndSignature: true,
    },
  },
  {
    id: "appointment-confirmation",
    name: "Employment Confirmation Letter",
    description:
      "Confirmation of successful completion of probationary period and permanent status.",
    category: "HR & Service",
    data: {
      docTitle: "EMPLOYMENT CONFIRMATION LETTER",
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: "ISSUED",
      addressee: "Mr. Hamza Farooq",
      addresseeSubtitle: "Employee ID: AGM-EMP-0412",
      subject: "Subject: Confirmation of Employment & Permanent Status",
      salutation: "Dear Hamza,",
      sections: [
        {
          id: "sec-cnf-1",
          heading: "Successful Probation Completion",
          paragraph:
            "Consequent to the review of your performance during your six-month probationary period commencing 1st March 2026, we are pleased to inform you that your employment with AGM Fitout Technical Services LLC has been confirmed effective 1st September 2026.",
          type: "PARAGRAPH",
        },
        {
          id: "sec-cnf-2",
          heading: "Designation & Benefits",
          type: "KEY_VALUE",
          keyValues: [
            {
              id: "kv-cnf-1",
              label: "Confirmed Designation",
              value: "Senior Interior Architect",
            },
            {
              id: "kv-cnf-2",
              label: "Department",
              value: "Design & Fitout Technical Engineering",
            },
            {
              id: "kv-cnf-3",
              label: "Notice Period",
              value: "30 Calendar Days",
            },
            {
              id: "kv-cnf-4",
              label: "Annual Leave Entitlement",
              value: "30 Calendar Days per annum",
            },
          ],
        },
        {
          id: "sec-cnf-3",
          heading: "Company Expectations",
          paragraph:
            "All other terms and conditions of your employment contract signed at the time of joining will remain in full force. We look forward to your continued dedication, innovation, and active contributions towards the company's growth.",
          type: "PARAGRAPH",
        },
      ],
      closingText:
        "Congratulations on your confirmation, and we wish you a long, rewarding, and prosperous career with AGM Aesthetic House.",
      signatoryCompany: "AGM Fitout Technical Services LLC",
      signatoryTitle: "Authorized Signatory,",
      signatoryName: "Assem Al-Khatib",
      signatoryDesignation: "Managing Director",
      showStampAndSignature: true,
    },
  },
  {
    id: "general-blank",
    name: "Custom Blank Letter / Certificate",
    description:
      "Start from a blank canvas with custom title, custom headings, paragraphs, and sections.",
    category: "Administrative",
    data: {
      docTitle: "OFFICIAL COMPANY LETTER",
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: "DRAFT",
      addressee: "To Whom It May Concern,",
      addresseeSubtitle: "Dubai, United Arab Emirates",
      subject: "Subject: Official Company Communication",
      salutation: "Dear Sir / Madam,",
      sections: [
        {
          id: "sec-blk-1",
          heading: "1. Purpose of Letter",
          paragraph:
            "Write the introductory section and main context of this formal letter or certificate here. You can add more paragraphs, headings, key-value tables, and bullet lists.",
          type: "PARAGRAPH",
        },
        {
          id: "sec-blk-2",
          heading: "2. Key Specifics & Particulars",
          type: "BULLETS",
          bulletPoints: [
            "First key clause, specification, or term.",
            "Second key clause, specification, or term.",
          ],
        },
      ],
      closingText:
        "This official letter is issued by AGM Fitout Technical Services LLC under authorized company signature and seal.",
      signatoryCompany: "AGM Fitout Technical Services LLC",
      signatoryTitle: "Authorized Signatory,",
      signatoryName: "Zeeshan Ahmad",
      signatoryDesignation: "Authorized Signatory",
      showStampAndSignature: true,
    },
  },
];

export const DEFAULT_CUSTOM_LETTER: CustomLetterDocumentData = {
  id: "cl-2026-0001",
  refNumber: "AGM/CORP/CL/2026/0001",
  ...LETTER_PRESETS[0].data,
};
