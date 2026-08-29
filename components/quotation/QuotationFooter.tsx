import React from "react";

interface QuotationFooterProps {
  className?: string;
}

export const QuotationFooter: React.FC<QuotationFooterProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`mt-4 print:mt-0 print:fixed print:bottom-0 print:left-0 print:right-0 print:w-full print:z-50 relative w-full bg-transparent print-avoid-break overflow-hidden ${className}`}
      style={{ aspectRatio: "1336 / 100" }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1536 100"
        width="93%"
        height="93%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "flex", justifySelf: "center", margin: "auto" }}
        // fontFamily="Arial, Helvetica, sans-serif"
      >
        <rect x="0" y="0" width="1536" height="100" fill="#ffffff" />

        <polygon points="17,0 143,0 46,77 17,78" fill="#17182a" />

        <polygon points="1519,17 1519,99 1390.3,99 1495,17" fill="#17182a" />

        <polygon points="155,4 1502.2,0 1375,99 35,99" fill="#054808" />

        <text
          x="425"
          y="38"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="26"
          fontWeight="bold"
        >
          VAT:104094432200003
        </text>
        <text
          x="1085"
          y="38"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="26"
          fontWeight="bold"
        >
          Company Name : AGM Fitout Technical Services
        </text>

        <text
          x="768"
          y="65"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="19"
          fontWeight="bold"
        >
          Sheikh Zayed Road, near Oasis Centre Office No. 13-11 Building: Adel
          Mohammed Ali Jassim Al Marzouqi Al Goze First 1 – Dubai,
        </text>
        <text
          x="768"
          y="88"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="19"
          fontWeight="bold"
        >
          United Arab Emirates
        </text>
      </svg>
    </div>
  );
};

export default QuotationFooter;
