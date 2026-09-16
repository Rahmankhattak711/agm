export interface AgreementParty {
  role: string;
  name: string;
  licenseNumber?: string;
  representative?: string;
  eid?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface ClientMaterialItem {
  id: string;
  label: string;
  code: string;
}

export interface PaymentMilestoneItem {
  id: string;
  percentage: number | string;
  milestone: string;
}

export interface AgreementClause {
  id?: string;
  number: number;
  title?: string;
  text: string;
  subItems?: string[];
  isEditable?: boolean;
}

export interface AgreementDocumentData {
  id: string;
  title: string;
  refNumber: string;
  date: string;
  status?: "DRAFT" | "ACTIVE" | "COMPLETED";
  copiesCount: number;
  contractor: AgreementParty;
  client: AgreementParty;
  property: string;
  project: string;
  contractValueNum: number;
  contractValueText: string;
  quotationRef: string;
  clientMaterials: ClientMaterialItem[];
  clauses: AgreementClause[];
  paymentMilestones: PaymentMilestoneItem[];
  contractorSignatory: {
    title: string;
    name: string;
    signatureUrl?: string;
  };
  clientSignatory: {
    title: string;
    name: string;
    signatureUrl?: string;
  };
  createdBy?: {
    id?: string;
    fullName?: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_CLIENT_MATERIALS: ClientMaterialItem[] = [
  { id: "mat-1", code: "a", label: "Floor and wall tiles" },
  { id: "mat-2", code: "b", label: "Lights" },
  { id: "mat-3", code: "c", label: "Sanitaryware for bathrooms" },
  { id: "mat-4", code: "d", label: "Kitchen appliances" },
];

export const DEFAULT_PAYMENT_MILESTONES: PaymentMilestoneItem[] = [
  { id: "ms-1", percentage: 40, milestone: "Advance Payment" },
  { id: "ms-2", percentage: 25, milestone: "Tiling work will start" },
  { id: "ms-3", percentage: 20, milestone: "Woodwork at site" },
  { id: "ms-4", percentage: 15, milestone: "1-month PDC upon handing over" },
];

export const DEFAULT_AGREEMENT_CLAUSES: AgreementClause[] = [
  {
    id: "cls-1",
    number: 1,
    title: "Identification and Documentation",
    text: "Client identification and title deed must be submitted before the commencement of work.",
  },
  {
    id: "cls-2",
    number: 2,
    title: "Materials to be Provided by Client",
    text: "Materials to be provided by the Client are listed in Section B above (Floor & wall tiles, Lights, Sanitaryware for bathrooms, Kitchen appliances).",
    subItems: [
      "Floor and wall tiles",
      "Lights",
      "Sanitaryware for bathrooms",
      "Kitchen appliances",
    ],
  },
  {
    id: "cls-3",
    number: 3,
    title: "Site Inspection and Handover",
    text: "Site handover and technical inspections shall occur prior to commencement of physical works.",
  },
  {
    id: "cls-4",
    number: 4,
    title: "Permits and Authority Approvals",
    text: "Client is responsible for obtaining all necessary approvals and permits before the commencement of work. Client shall provide the Contractor with supporting documentation reasonably required by authority to grant renovation permit. Payments of any permit fees, such as third-party insurance (if applicable), security deposit, community fees, etc. will be settled by Client.",
  },
  {
    id: "cls-5",
    number: 5,
    title: "Design Development and Material Selection",
    text: "Design development and support with material selection are included in the Scope of Works and Contract Value and are expected to be completed within 2 weeks from contract signature. (if applicable)",
  },
  {
    id: "cls-6",
    number: 6,
    title: "Work Commencement on Site",
    text: "Design development and material selection work will commence within 2 working days after the date of receipt of the first milestone payment by the Contractor (advance payment). Work on site shall commence in the first week of Mar, (if the advance payment is made by 16th Feb).",
  },
  {
    id: "cls-7",
    number: 7,
    title: "Project Timeline",
    text: "The project timeline is estimated at 50 to 55 working days from start of site work, contingent upon availability of Client-provided material at the site.",
  },
  {
    id: "cls-8",
    number: 8,
    title: "Project Delays and Penalties",
    text: "Delay: In the event of delay for reasons not attributable to the Client the Client can deduct a delay penalty from the Contractor as follows: 1% of contract price for each week the completion of the project is delayed. If the Contractor fails to finish the renovation, the Client can, upon informing the Contractor in writing, contract another company to complete the renovation at the cost of the Contractor.",
  },
  {
    id: "cls-9",
    number: 9,
    title: "Delivery and Material Offloading",
    text: "All materials must be received within the contract location (no material offloading). Additional charges will apply if Client requests Contractor to offload delivery of materials ordered by the Client.",
  },
  {
    id: "cls-10",
    number: 10,
    title: "Material Breakage and Handling",
    text: "Material breakage, contractor not responsible in case of any material breakage while offloading or installation, unless the damage caused because of lack of attention or neglection.",
  },
  {
    id: "cls-11",
    number: 11,
    title: "Suspension of Work",
    text: "The contractor retains the right to suspend work in the event of (1) delayed Client payments or (2) delay in delivery of Client-provided material, with rescheduling of work to be determined accordingly.",
  },
  {
    id: "cls-12",
    number: 12,
    title: "Variations and Additional Scope",
    text: "Any variations to the agreed scope will be agreed by the Parties and will be subject to additional costs. Contractor will not perform furniture assembly or delivery offloading from 3rd parties.",
  },
  {
    id: "cls-13",
    number: 13,
    title: "Sample Approvals and Scope Submission",
    text: "Contractor shall prepare and submit the samples, the scope of work to Client.",
  },
  {
    id: "cls-14",
    number: 14,
    title: "Customized Items & Written Approval",
    text: "The contractor shall ensure that any customized items/ sketches and / or visual representations shall be approved in writing by the Client.",
  },
  {
    id: "cls-15",
    number: 15,
    title: "Client Order Approvals",
    text: "Items will not be ordered until the Client has approved.",
  },
  {
    id: "cls-16",
    number: 16,
    title: "Direct Client Merchandise Purchases",
    text: "Should Merchandise be ordered by the Client and be sent directly to the Client. The Contractor is not responsible for such purchases.",
  },
  {
    id: "cls-17",
    number: 17,
    title: "Common Areas Protection and Indemnification",
    text: "The Contractor will make sure that common areas are taken care off and no damage is made. The Contractor shall be liable for any damage to any 3rd party or community property/facilities caused by the Contractor and shall indemnify the Client from any costs in relation to the same. The Client reserves the right to deduct the cost of any damage caused by the Contractor from payments due to Contractor under this contract. If there is any damage done by Contractor to 3rd parties and such damage cannot be repaired by the Contractor, it will be documented and if there are any fines, will be settled from the last payment.",
  },
  {
    id: "cls-18",
    number: 18,
    title: "Third-Party Contractors and Site Rules",
    text: "No third-party contractor to work at the site unless Contractor is informed about scope and time, Our company is not responsible for any damage or breakage that occurs on the site in the event of a violation of this clause, Furthermore, any such presence requires a prior written Letter of No Objection from our side, and a signed undertaking letter from the other contractor formally accepting full responsibility for their presence and actions, contractor not responsible for any damage of the client belongs at the site unless proven, or will be charged to the subcontractors.",
  },
  {
    id: "cls-19",
    number: 19,
    title: "Payment Milestones and Schedule",
    text: "Payment Terms shall strictly adhere to the agreed 4-stage milestone schedule (40% Advance, 25% Tiling, 20% Woodwork, 15% 1-month PDC).",
    subItems: [
      "40% Advance Payment",
      "25% Tiling work will start",
      "20% Woodwork at site",
      "15% 1-month PDC upon handing over",
    ],
  },
  {
    id: "cls-20",
    number: 20,
    title: "Method of Payment and Currency",
    text: "All payments under this Contract shall be made in AED by wire transfer of funds to the Contractor's bank account.",
  },
  {
    id: "cls-21",
    number: 21,
    title: "Warranty Period",
    text: "The Contractor provides a 12-months warranty on the work performed by the Contractor under the Contract. This warranty does not cover modifications made by the Client to Contractor's work and any items not included in the scope of work in the Quotation.",
  },
  {
    id: "cls-22",
    number: 22,
    title: "Compliance with UAE Laws and Regulations",
    text: "By signing this Contract, the Contractor guarantees that he will follow the applicable laws and regulations of UAE, having all the legal documents and insurances to execute this renovation.",
  },
  {
    id: "cls-23",
    number: 23,
    title: "No-Smoking Policy",
    text: "Smoking inside the Property is strictly prohibited.",
  },
  {
    id: "cls-24",
    number: 24,
    title: "Electrical Safety and Shift Shutdown",
    text: "Main electricity shall be switched off after every shift or when the Property is left under no supervision to avoid fire. If a third party is working on the Property when the Contractor is not present, the Contractor will not handle responsibility for this.",
  },
  {
    id: "cls-25",
    number: 25,
    title: "Worker Welfare and Organization",
    text: "Welfare for Contractor's site staff, such as drinking water, food, prayer area etc are the Contractors responsibility to organize.",
  },
  {
    id: "cls-26",
    number: 26,
    title: "Waste Debris Disposal & Site Cleanliness",
    text: "The Contractor is responsible for removing and dumping waste material and debris to an approved dumping area or facility and the cost of waste material removal and dumping is included in the fixed Contract Price. Contractor will not hold responsibility for dumping third party material, charge will apply if the Contractor must do so at the request of the Client.",
  },
  {
    id: "cls-27",
    number: 27,
    title: "Unrelated Client Equipment and Goods",
    text: "Any materials or equipment supplied or stored at the work site by the Client that are unrelated to the scope of work agreed upon in this contract fall under the sole responsibility of the Client. Our company is not responsible for protecting these materials against loss, theft, damage, or any harm that may befall them.",
  },
  {
    id: "cls-28",
    number: 28,
    title: "Governing Law and Jurisdiction",
    text: "Issues not regulated by this Contract shall be governed by the provisions of the current legislation of the UAE and the Emirate of Dubai.",
  },
];

export const SAMPLE_RENOVATION_AGREEMENT: AgreementDocumentData = {
  id: "agm-agr-01147-r3",
  title: "AGM FITOUT AGREEMENT",
  refNumber: "Q-01147 R3 - Dubai Marina Sulafa tower 1102",
  date: "14/02/2026",
  copiesCount: 2,
  contractor: {
    role: "Contractor",
    name: "AGM Fitout",
    licenseNumber: "1120950",
    representative: "Muhamed Assem",
    eid: "8741984-3163965-1",
    phone: "050 340 7300",
    email: "assem@agmfitout.com",
    address:
      "Sheikh Zayed Road, near Oasis Centre, Office No. 13-11, Adel Mohammed Ali Jassim Al Marzouqi Bldg, Dubai",
  },
  client: {
    role: "Client",
    name: "Valeriia Lysiuk",
    eid: "784-1991-2848618-2",
    phone: "055 351 9022",
    email: "valeriia.lysiuk@example.com",
    address: "Dubai Marina Sulafa Tower 1102",
  },
  property: "Dubai Marina Sulafa Tower 1102",
  project:
    "Execution of General Renovation works in the above-mentioned Property",
  contractValueNum: 110000,
  contractValueText:
    "One Hundred Ten Thousand AED, including VAT. The price for the Scope of Works included in the approved quotation Q-1147 R3 is fixed.",
  quotationRef: "Q-01147 R3",
  clientMaterials: DEFAULT_CLIENT_MATERIALS,
  clauses: DEFAULT_AGREEMENT_CLAUSES,
  paymentMilestones: DEFAULT_PAYMENT_MILESTONES,
  contractorSignatory: {
    title: "AGM Fitout",
    name: "Muhammed Assem",
  },
  clientSignatory: {
    title: "Client",
    name: "Valeriia Lysiuk",
  },
};

export const AVAILABLE_COMPANY_DOCUMENTS = [
  {
    id: "renovation-agreement",
    name: "Fitout Renovation Agreement",
    category: "Contracts & Agreements",
    refPrefix: "AGM-AGR-",
    description:
      "Complete 4-page execution agreement including parties, property details, materials, 28 terms & conditions, and signatures.",
  },
  {
    id: "terms-and-conditions",
    name: "Standard Company Terms & Conditions",
    category: "Legal Policy",
    refPrefix: "AGM-TNC-",
    description:
      "Official 28-clause statutory company terms and site rules for fit-out and renovation works in UAE.",
  },
  {
    id: "scope-addendum",
    name: "Scope of Works Addendum & Variation",
    category: "Addendums",
    refPrefix: "AGM-ADD-",
    description:
      "Formal contract variation document defining additional scope, milestone schedule, and amended contract value.",
  },
  {
    id: "letter-undertaking",
    name: "Subcontractor / 3rd-Party Undertaking",
    category: "Site Management",
    refPrefix: "AGM-NOC-",
    description:
      "No Objection Certificate (NOC) and signed site liability undertaking for third-party specialists.",
  },
];
