export interface QuotationMeta {
  quotationNo: string;
  date: string;
  validUntil: string;
  customerId?: string;
  customer: string;
  attention?: string;
  address: string;
  trn?: string;
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
  points?: string[];
  qty: number | string;
  unit?: string;
  rate: number | string;
  isFree?: boolean;
}

export interface QuotationTemplateProps {
  initialMeta?: Partial<QuotationMeta>;
  initialItems?: QuotationItem[];
  initialVatPct?: number | string;
  initialDiscount?: number | string;
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
    text: "The Client acknowledges and agrees that items related to repairs, remodeling, and refurbishment materials, such as doors, walls, and cabinets etc. may not result in a 100% perfect finish due to the condition of the existing items.",
  },
  {
    id: 8,
    title: "Third-Party Contractor Liability:",
    text: "The Client acknowledges that other contractors may be working on-site. AGM Fitout Technical Services LLC shall not be held liable for any major or minor damage caused by them. The Client shall ensure proper coordination among all parties on-site. Any repair or rework required because of such damage shall be carried out at the Client’s cost.",
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

export const extractSubItems = (desc: string): string[] => {
  if (!desc) return [""];
  const lines = desc
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length <= 1) return [desc];
  return lines.map((l) => l.replace(/^(\d+[\.\)]\s*|[-•*]\s*)/, "").trim());
};

export const SAMPLE_SCOPE_ITEMS: QuotationItem[] = [
  {
    id: 1,
    section: "Preliminaries",
    desc: "Preliminaries and mobilization for the project. Includes site protection where required, and demobilization upon completion. All as per local contract conditions.",
    qty: "Free",
    rate: "Free",
    isFree: true,
  },
  {
    id: 2,
    section: "External Work",
    desc: "build plantes pots, tiling with LED lighting *",
    qty: 1,
    rate: 4300,
  },
  {
    id: 3,
    section: "External Work",
    desc: "MEP work, testing and remodeling the irrigation system *",
    qty: 1,
    rate: 8700,
  },
  {
    id: 4,
    section: "External Work",
    desc: "Aluminum Pergola for the car parking *",
    qty: 1,
    rate: 6600,
  },
  {
    id: 5,
    section: "Guest Bathroom",
    desc: "1. Remove the existing wall and floor tiles, ceiling, counters,fittings, and sanitary, transfer and dump\n2. Remodule the piping and the dranage to match the new design and install all the elictromechanical work (Basin, Basin Mixer, angle valves, bottle trap, waste, mirror, angle valves, etc.)\n3. Gypsum ceiling including installation and ceiling light, and access panel, including walls paint\n4. Install Wall & floor tiles, including waterproofing, selefleveling if required, glue and grout, niche where is required (client to provide the tiles)",
    qty: 1,
    rate: 11000,
  },
  {
    id: 6,
    section: "Majlis Washroom",
    desc: "1. Remove the existing wall and floor tiles, ceiling, counters,fittings, and sanitary, transfer and dump\n2. Remodule the piping and the dranage to match the new design and install all the elictromechanical work (Basin, Basin Mixer, angle valves, bottle trap, waste, mirror, angle valves, etc.)\n3. Gypsum ceiling including installation and ceiling light, and access panel, including walls paint\n4. Install Wall & floor tiles, including waterproofing, selefleveling if required, glue and grout, niche where is required (client to provide the tiles)",
    qty: 1,
    rate: 11000,
  },
  {
    id: 7,
    section: "Kids Bathroom 1 & 2",
    desc: "1. Remove the existing wall and floor tiles, ceiling, counters,fittings, and sanitary, transfer and dump\n2. Remodule the piping and the dranage to match the new design and install all the elictromechanical work (Basin, Basin Mixer, angle valves, bottle trap, waste, mirror, angle valves, etc.)\n3. Gypsum ceiling including installation and ceiling light, and access panel, including walls paint\n4. Install Wall & floor tiles, including waterproofing, selefleveling if required, glue and grout, niche where is required (client to provide the tiles)",
    qty: 2,
    rate: 11000,
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
