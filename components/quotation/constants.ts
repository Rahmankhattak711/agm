export interface QuotationMeta {
  quotationNo: string;
  date: string;
  validUntil: string;
  customer: string;
  attention: string;
  address: string;
  trn: string;
  mobile: string;
  email?: string;
  project: string;
  location: string;
  reference: string;
  preparedBy: string;
  contact: string;
}

export interface QuotationItem {
  id: number | string;
  section?: string;
  productId?: string;
  desc: string;
  qty: number | string;
  unit?: string;
  rate: number | string;
  isFree?: boolean;
}

export interface QuotationTemplateProps {
  initialMeta?: Partial<QuotationMeta>;
  initialItems?: QuotationItem[];
  availableProducts?: any[];
  onPrint?: () => void;
  hideOuterWrapper?: boolean;
}

export type MetaKey = keyof QuotationMeta;
export type ItemKey = keyof Omit<QuotationItem, "id">;

export const DEFAULT_TERMS_AND_CONDITIONS = [
  {
    id: 1,
    title: "Quotation Validity:",
    text: "This quotation is valid for Ten(10) days from the date of issuance.",
  },
  {
    id: 2,
    title: "Preliminary Site Assessment and Material Submissions:",
    text: "Prior to the confirmation of pricing, a site visit and the submission of material details are required.",
  },
  {
    id: 3,
    title: "Confirmation of Red Marked Items:",
    text: "All items marked in red will be confirmed post thorough inspections of the site, design validation, and material confirmation.",
  },
  {
    id: 4,
    title: "Quotation Considerations:",
    text: "The quotation encompasses all specified items. Any alterations in quantity or removal of items may result in adjustments to the overall project cost.",
  },
  {
    id: 5,
    title: "Client Responsibilities:",
    text: "The client is responsible for obtaining all necessary approvals and permits before the commencement of work. AGM holds no liability for any delays caused, and is not obliged to adhere to the initially agreed starting date. If there any third-party insurance and gate pass required shall be paid by the Client.",
  },
  {
    id: 6,
    title: "Design and Material Selection Timeline:",
    text: "A period of days is required for design development and material selections.",
  },
  {
    id: 7,
    title: "Quality and Finish Disclaimer:",
    text: "The Client acknowledges and agrees that item related to repairs, remodelling, and refurbishment materials, such as doors, walls, and cabinets etc may be not result in a 100% perfect finish due to the condition of item.",
  },
  {
    id: 8,
    title: "Third-Party Contractor Liability:",
    text: "The Client acknowledges that other contractors working on-site. AGM Fitout Technical Services LLC shall not be held liable for any major or minor damage caused by (Whom). The Client shall ensure proper coordination among all parties on-site. Any repair or rework required because of such damage shall be carried out at the Client’s cost.",
  },
  {
    id: 9,
    title: "Commencement of Work:",
    text: "Work will commence 7 to 10 days from the date of confirmation (defined as the date of payment receipt). AGM reserves the right to modify the start date if the work permit is not secured or advance payment not received.",
  },
  {
    id: 10,
    title: "Documentation Requirements:",
    text: "Client identification and title deed must be submitted before the commencement of work.",
  },
  {
    id: 11,
    title: "Project Duration:",
    text: "The project timeline is estimated at 55 to 60 working days, contingent upon material availability at the site.",
  },
  {
    id: 12,
    title: "Material Delivery:",
    text: "All materials must be received within the contract location. Additional charges may apply for handling and must be settled promptly.",
  },
  {
    id: 13,
    title: "Electrical and Plumbing Connections:",
    text: "Electrical and plumbing connections must be prepared at the installation site. Additional charges will be incurred if professional assistance is required.",
  },
  {
    id: 14,
    title: "Work Suspension:",
    text: "AGM retains the right to suspend work in the event of delayed client payments, with rescheduling of work to be determined accordingly.",
  },
  {
    id: 15,
    title: "Variation Costs:",
    text: "Any variations to the agreed scope will incur immediate additional costs.",
  },
  {
    id: 16,
    title: "For quotations below 10,000 AED,",
    text: "the full amount (100%) is due advance payment upon acceptance of the offer to commence work.",
  },
  {
    id: 17,
    title: "Any changes requested by the Client",
    text: "to the approved materials, samples, installation supplies, or any mutually agreed-upon specifications after the acceptance of this quotation will be subject to additional costs and a reasonable extension of the project timeline. All additional costs must be paid immediately upon invoicing and prior to the implementation of the changes.",
  },
  {
    id: 18,
    title: "Site Access :",
    text: "No other contractors are present at the work site during our operational period. Our company is not responsible for any damage or breakage that occurs on the site in the event of a violation of this clause, Furthermore, any such presence requires a prior written Letter of No Objection from our side, and a signed undertaking letter from the other contractor formally accepting full responsibility for their presence and actions.",
  },
  {
    id: 19,
    title:
      "Any materials or equipment supplied or stored at the work site by the Client",
    text: "that are unrelated to the scope of work agreed upon in this contract fall under the sole responsibility of the Client. Our company is not responsible for protecting these materials against loss, theft, damage, or any harm that may befall them.",
  },
  {
    id: 20,
    title: "Materials that are manufactured or supplied by the Client",
    text: "are considered outside our contractual scope of responsibility. We completely disclaim responsibility for any manufacturing defects, damage during supply/delivery, or errors in the installation of these materials. The Client alone bears full responsibility for the quality and suitability of these materials.",
  },
];

export const DEFAULT_PAYMENT_TERMS = [
  "40 % Advance",
  "20% Floor work done at ground floor (whichever comes first)",
  "20% Glass work at site (whichever comes first)",
  "15% Wood work at site",
  "5 % Upon handing over",
];

export const SAMPLE_SCOPE_ITEMS: QuotationItem[] = [
  {
    id: 1,
    section: "Preliminaries",
    desc: "Preliminaries and mobilization for the project. Includes site protection where required, and demobilization upon completion. All as per local contract conditions, Rate covers standard site protection to common areas. Extensive protection to furniture/artworks charged extra.",
    qty: "Free",
    rate: "Free",
    isFree: true,
  },
  {
    id: 2,
    section: "Garage Work",
    desc: "Removal of existing aluminum frames from site including careful dismantling, Loading, Transportation & Disposal of debris to Dubai Municipality approved landfill.",
    qty: 1,
    rate: 3600,
  },
  {
    id: 3,
    section: "Garage Work",
    desc: "Heavy duty aluminum garage door, powder coated, double skin insulated panels, with thermal break. Color:(client will choose), Supply & install aluminum frame with all necessary fixing brackets and anchors.",
    qty: 1,
    rate: 3900,
  },
  {
    id: 4,
    section: "Garage Work",
    desc: "Supply and installation of\nGlass: double glass Fixed unit 6 mm-16 mm air space - 6mm external glass to be reflective\nFrame Finish: Aluminum powder coated.",
    qty: 2,
    rate: 5400,
  },
  {
    id: 5,
    section: "Entrance",
    desc: "Dismantling, removal, and site clearance of the existing main entrance door and frame assembly.\nSupply and installation of Wooden Main Entrance Door with Sidelight.\nSupply, fitting, and finishing of a new wooden entrance door assembly with an integrated glass side panel, including framing and standard ironmongery (hinges, handles, and locks).",
    qty: 1,
    rate: 14500,
  },
  {
    id: 6,
    section: "Tiling work (Ground Floor)",
    desc: "Remove the existing floor tiles. Supply and professional laying of floor tiles. (Note: The quoted rate is applicable for porcelain tiles wooden-finish, Italian or Spanish made as per client selection). Inspection and preparation of the existing subfloor, including the application of a self-leveling compound (where required) to ensure a perfectly flat and sound base for installation.",
    qty: 98,
    rate: 250,
  },
  {
    id: 7,
    section: "Kitchen",
    desc: "Fabrication and installation of kitchen cabinets made of MR MDF, laminated white carcass, center island cabinets with quartz countertop, Blum soft close hinges and drawer railings. Drawing & design to be issued after client confirmation.",
    qty: 1,
    rate: 76200,
  },
  {
    id: 8,
    section: "Others",
    desc: "Complimentary site inspection after 3 month of handing over.",
    qty: 1,
    rate: "Free",
    isFree: true,
  },
];

export const formatCurrency = (n: number): string =>
  n.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const numberToWords = (num: number): string => {
  if (!num || num === 0) return "Zero";
  const ones = [
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
  const tens = [
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

  const chunk = (n: number): string => {
    let s = "";
    if (n >= 100) {
      s += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      s += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) s += ones[n] + " ";
    return s.trim();
  };

  let n = Math.floor(num);
  if (n === 0) return "Zero";

  const parts: string[] = [];
  const scales: [string, number][] = [
    ["", 1],
    ["Thousand", 1000],
    ["Million", 1000000],
  ];
  for (let i = scales.length - 1; i >= 0; i--) {
    const scaleValue = scales[i][1];
    const scaleName = scales[i][0];
    const scaleCount = Math.floor(n / scaleValue);
    if (scaleCount > 0) {
      parts.push(chunk(scaleCount) + (scaleName ? " " + scaleName : ""));
      n %= scaleValue;
    }
  }
  return parts.join(" ").trim();
};
