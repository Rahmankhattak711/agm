export interface SalaryCertificateDocumentData {
  id: string;
  refNumber: string;
  date: string;
  status: "DRAFT" | "ACTIVE" | "ISSUED" | "COMPLETED";
  addressee: string;
  employeePrefix: "Mr." | "Ms." | "Mrs." | "Dr.";
  employeeName: string;
  emiratesId: string;
  joiningDate: string;
  companyName: string;
  position: string;
  purposeDisclaimer: string;
  monthlySalaryNum: number;
  monthlySalaryText: string;
  currency: string;

  signatoryCompany: string;
  signatoryTitle: string;
  signatoryName: string;
  signatoryDesignation: string;
  signatorySignatureUrl?: string;
  companyStampUrl?: string;
  showStampAndSignature: boolean;

  city: string;
  poBox: string;
  landline: string;
  telephone: string;

  vatNumber: string;
  footerCompanyName: string;
  registeredAddress: string;

  employeeId?: string;
  notes?: string;
  createdBy?: {
    id?: string;
    fullName?: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export const SAMPLE_SALARY_CERTIFICATE: SalaryCertificateDocumentData = {
  id: "sc-2026-00876",
  refNumber: "AGM/AC/SC/2026/00876",
  date: "04 Sep 2026",
  status: "ISSUED",

  addressee: "To Whom It May Concern,",
  employeePrefix: "Mr.",
  employeeName: "Mohamed Said Abdelsamie Abdelwahab",
  emiratesId: "784-1994-1500490-4",
  joiningDate: "30/4/2024",
  companyName: "AGM Fitout Technical Services LLC",
  position: "Tile Polisher",
  purposeDisclaimer:
    "This certificate is issued upon the employee's request for submission to the authority concerned. It does not constitute any financial guarantee or liability on the part of the company. This is an official system-generated certificate.",
  monthlySalaryNum: 5000,
  monthlySalaryText: "Five Thousand UAE Dirhams only",
  currency: "AED",
  signatoryCompany: "AGM Fitout Technical Services LLC",
  signatoryTitle: "Authorized Signatory,",
  signatoryName: "Zeeshan Ahmad",
  signatoryDesignation: "Accountant",
  showStampAndSignature: true,
  city: "Dubai",
  poBox: "No",
  landline: "New 1143 Business Center LLC",
  telephone: "+971 4 280 4184",
  vatNumber: "104094432200003",
  footerCompanyName: "AGM Fitout Technical Services",
  registeredAddress:
    "Sheikh Zayed Road, near Oasis Centre Office No. 13-11 Building: Adel Mohammed Ali Jassim Al Marzouqi Al Goze First 1 – Dubai, United Arab Emirates",
};

export function numberToWordsAED(num: number): string {
  if (isNaN(num) || num <= 0) return "Zero UAE Dirhams only";

  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertChunk(n: number): string {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " " + convertChunk(n % 100) : "")
      );
    return "";
  }

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let words = "";

  const millions = Math.floor(integerPart / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const remainder = integerPart % 1000;

  if (millions > 0) {
    words += convertChunk(millions) + " Million ";
  }
  if (thousands > 0) {
    words += convertChunk(thousands) + " Thousand ";
  }
  if (remainder > 0) {
    words += convertChunk(remainder);
  }

  words = words.trim();

  let result = words ? `${words} UAE Dirhams` : "";

  if (decimalPart > 0) {
    const filsWords = convertChunk(decimalPart);
    result += ` and ${filsWords} Fils`;
  }

  return `${result.trim()} only`;
}
