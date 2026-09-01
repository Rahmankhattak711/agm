import React from "react";

interface QuotationFooterProps {
  className?: string;
}

export const QuotationFooter: React.FC<QuotationFooterProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`quotation-footer mt-4 print:mt-0 relative w-full bg-white overflow-hidden max-w-full! ${className}`}
      style={{
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 220"
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          maxHeight: "135px",
          overflow: "hidden",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <polygon points="0,12 875,12 857,18 0,18" fill="#064018" />

        <polygon points="893,10 1200,10 1200,20 875,20" fill="#0b1e38" />

        <g>
          <path
            fill="#064018"
            fillRule="evenodd"
            d="M 48,76 A 22,22 0 1,0 48,120 A 22,22 0 1,0 48,76 Z M 42.62,96.79 a 15.053,15.053 0 0,0 6.59,6.59 l 2.2,-2.2 c 0.27,-0.27 0.67,-0.36 1.02,-0.24 c 1.12,0.37 2.33,0.57 3.57,0.57 c 0.55,0 1,0.45 1,1 V 106 c 0,0.55 -0.45,1 -1,1 C 46.61,107 39,99.39 39,90 c 0,-0.55 0.45,-1 1,-1 h 3.5 c 0.55,0 1,0.45 1,1 c 0,1.25 0.2,2.45 0.57,3.57 c 0.11,0.35 0.03,0.74 -0.25,1.02 z"
          />

          <text
            x="82"
            y="93"
            fontSize="14"
            fill="#000000"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="700"
          >
            Mob: +971 50 340 7300
          </text>

          <text
            x="82"
            y="112"
            fontSize="14"
            fill="#000000"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="700"
          >
            Tel: +971 48 749839
          </text>
        </g>

        <line
          x1="262"
          y1="75"
          x2="262"
          y2="123"
          stroke="#d1d5db"
          strokeWidth="1.5"
        />

        <g>
          <path
            fill="#064018"
            fillRule="evenodd"
            d="M 298,76 A 22,22 0 1,0 298,120 A 22,22 0 1,0 298,76 Z M 306,90 H 290 c -1.1,0 -1.99,0.9 -1.99,2 L 288,104 c 0,1.1 0.9,2 2,2 h 16 c 1.1,0 2,-0.9 2,-2 V 92 c 0,-1.1 -0.9,-2 -2,-2 z m 0,4 l -8,5 l -8,-5 v -2 l 8,5 l 8,-5 z"
          />

          <text
            x="332"
            y="93"
            fontSize="13.5"
            fill="#000000"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="700"
          >
            info@agmfitout.ae
          </text>

          <text
            x="332"
            y="112"
            fontSize="13.5"
            fill="#000000"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="700"
          >
            projects@agmfitout.ae
          </text>
        </g>

        <line
          x1="518"
          y1="75"
          x2="518"
          y2="123"
          stroke="#d1d5db"
          strokeWidth="1.5"
        />

        <g>
          <path
            fill="#064018"
            fillRule="evenodd"
            d="M 552,76 A 22,22 0 1,0 552,120 A 22,22 0 1,0 552,76 Z M 552,88 c -5.52,0 -10,4.48 -10,10 s 4.48,10 10,10 s 10,-4.48 10,-10 s -4.48,-10 -10,-10 z m -1,17.93 c -3.95,-0.49 -7,-3.85 -7,-7.93 c 0,-0.62 0.08,-1.21 0.21,-1.79 L 549,101 v 1 c 0,1.1 0.9,2 2,2 v 1.93 z m 6.9,-2.54 c -0.26,-0.81 -1,-1.39 -1.9,-1.39 h -1 v -3 c 0,-0.55 -0.45,-1 -1,-1 h -2 v -2 h 2 c 0.55,0 1,-0.45 1,-1 v -2 h 2 c 1.1,0 2,-0.9 2,-2 v -0.41 c 2.93,1.19 5,4.06 5,7.41 c 0,2.08 -0.8,3.97 -2.1,5.39 z"
          />

          <text
            x="586"
            y="103"
            fontSize="14"
            fill="#000000"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="700"
          >
            www.agmfitout.ae
          </text>
        </g>

        <line
          x1="728"
          y1="75"
          x2="728"
          y2="123"
          stroke="#d1d5db"
          strokeWidth="1.5"
        />

        <g>
          <path
            fill="#064018"
            fillRule="evenodd"
            d="M 762,76 A 22,22 0 1,0 762,120 A 22,22 0 1,0 762,76 Z M 762,88 c -3.87,0 -7,3.13 -7,7 c 0,5.25 7,13 7,13 s 7,-7.75 7,-13 c 0,-3.87 -3.13,-7 -7,-7 z m 0,9.5 c -1.38,0 -2.5,-1.12 -2.5,-2.5 s 1.12,-2.5 2.5,-2.5 s 2.5,1.12 2.5,2.5 s -1.12,2.5 -2.5,2.5 z"
          />

          <text
            x="794"
            y="87"
            fontSize="11.5"
            fill="#000000"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="700"
          >
            Office No. 13-11, Bldg: Adel Mohammed Ali Jassim Al Marzouqi,
          </text>

          <text
            x="794"
            y="103"
            fontSize="11.5"
            fill="#000000"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="700"
          >
            Sheikh Zayed Road, near Oasis Centre, Al Quoz First 1,
          </text>

          <text
            x="794"
            y="119"
            fontSize="11.5"
            fill="#000000"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight="700"
          >
            Dubai, United Arab Emirates
          </text>
        </g>

        <polygon points="0,170 38,170 82,212 0,212" fill="#064018" />

        <polygon points="54,170 1146,170 1102,212 98,212" fill="#0b1e38" />

        <polygon points="1162,170 1200,170 1200,212 1118,212" fill="#064018" />

        <g
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="13"
          fontWeight="700"
          letterSpacing="1.2px"
          fill="#ffffff"
        >
          <text x="350" y="196" textAnchor="middle" fill="#ffffff">
            QUALITY WORK
          </text>

          <line
            x1="440"
            y1="186"
            x2="440"
            y2="200"
            stroke="#00838f"
            strokeWidth="1.5"
          />

          <text x="550" y="196" textAnchor="middle" fill="#ffffff">
            ON TIME DELIVERY
          </text>

          <line
            x1="660"
            y1="186"
            x2="660"
            y2="200"
            stroke="#00838f"
            strokeWidth="1.5"
          />

          <text x="785" y="196" textAnchor="middle" fill="#ffffff">
            CUSTOMER SATISFACTION
          </text>
        </g>
      </svg>
    </div>
  );
};

export default QuotationFooter;
