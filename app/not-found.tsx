"use client";

import { motion, type Variants } from "framer-motion";
import {
  HomeIcon,
  GridIcon,
  LineChartIcon,
  NetworkIcon,
  PackageIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";
import Link from "next/link";

const MODULES = [
  {
    href: "/dashboard",
    label: "Main Dashboard",
    sub: "Overview & key metrics",
    icon: <GridIcon size={20} strokeWidth={1.6} />,
  },
  {
    href: "/finance/reports",
    label: "Finance Reports",
    sub: "Statements & P&L",
    icon: <LineChartIcon size={20} strokeWidth={1.6} />,
  },
  {
    href: "/inventory/suppliers",
    label: "Supplier Network",
    sub: "Vendor management",
    icon: <NetworkIcon size={20} strokeWidth={1.6} />,
  },
  {
    href: "/inventory/products",
    label: "Product Catalog",
    sub: "Inventory & items",
    icon: <PackageIcon size={20} strokeWidth={1.6} />,
  },
];

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
      when: "beforeChildren",
    },
  },
};

const leftVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.05 } },
};

const rightVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.15 } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
};

const moduleVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", delay: 0.25 } },
};

const descVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", delay: 0.35 } },
};

const btnVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", delay: 0.45 } },
};

export default function NotFound() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-agm-bg font-sans px-6 py-10">
      <motion.div
        className="w-full max-w-5xl bg-agm-card rounded-3xl shadow-xl shadow-black/5 border border-agm-border overflow-hidden"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2">

          <motion.div
            className="p-10 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-agm-border"
            variants={leftVariants}
          >
            <div>
              <motion.div
                className="font-black leading-none tracking-tighter select-none mb-2 text-agm-green"
                style={{ fontSize: "clamp(6rem, 15vw, 9rem)" }}
                animate={{
                  textShadow: [
                    "0 4px 24px rgba(40,99,58,0.1)",
                    "0 4px 40px rgba(40,99,58,0.4)",
                    "0 4px 24px rgba(40,99,58,0.1)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                404
              </motion.div>
              <p className="text-xs font-black uppercase tracking-widest text-agm-green mb-6">
                Page Not Found
              </p>
            </div>

            <motion.div
              className="grid grid-cols-2 gap-2.5"
              variants={staggerContainer}
            >
              {MODULES.map((m) => (
                <motion.div
                  key={m.href}
                  variants={moduleVariants}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                >
                  <Link
                    href={m.href}
                    className="group flex items-center gap-3 p-3.5 rounded-2xl border border-agm-border bg-agm-box-bg hover:bg-agm-green-soft hover:border-agm-box-border transition-colors duration-200"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-agm-green-soft group-hover:bg-agm-card flex items-center justify-center text-agm-green transition-all duration-200 border border-agm-box-border">
                      {m.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-agm-text group-hover:text-agm-green transition-colors duration-200 leading-tight">
                        {m.label}
                      </p>
                      <p className="text-[10px] text-agm-subtle leading-tight">{m.sub}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="p-10 sm:p-12 flex flex-col justify-center"
            variants={rightVariants}
          >
            <motion.div
              className="flex justify-center mb-8"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                <motion.circle
                  cx="90" cy="90" r="70"
                  fill="#e8f0e8" stroke="#dbe2db" strokeWidth="1.5"
                  strokeDasharray="6 4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  style={{ transformOrigin: "90px 90px" }}
                />
                <circle cx="90" cy="90" r="48" fill="white" stroke="#dbe2db" strokeWidth="1.5" />
                <circle cx="90" cy="90" r="36" fill="#e8f0e8" stroke="#28633a" strokeWidth="2" opacity="0.4" />
                <circle cx="90" cy="90" r="4" fill="#28633a" />

                <motion.g
                  style={{ transformOrigin: "90px 90px" }}
                  animate={{ rotate: [0, 12, -8, 6, -4, 2, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                >
                  <path d="M90 54 L97 86 L90 90 L83 86 Z" fill="#28633a" opacity="0.85" />
                  <path d="M90 126 L83 94 L90 90 L97 94 Z" fill="#e8f0e8" stroke="#dbe2db" strokeWidth="1" />
                  <path d="M54 90 L86 83 L90 90 L86 97 Z" fill="#28633a" opacity="0.5" />
                  <path d="M126 90 L94 97 L90 90 L94 83 Z" fill="#e8f0e8" stroke="#dbe2db" strokeWidth="1" />
                </motion.g>

                <line x1="90" y1="42" x2="90" y2="50" stroke="#28633a" strokeWidth="2" strokeLinecap="round" />
                <line x1="90" y1="130" x2="90" y2="138" stroke="#28633a" strokeWidth="2" strokeLinecap="round" />
                <line x1="42" y1="90" x2="50" y2="90" stroke="#28633a" strokeWidth="2" strokeLinecap="round" />
                <line x1="130" y1="90" x2="138" y2="90" stroke="#28633a" strokeWidth="2" strokeLinecap="round" />

                <circle cx="143" cy="48" r="13" fill="#f8f7f2" stroke="#dbe2db" strokeWidth="1.5" />
                <path d="M143 43v5M143 53v1" stroke="#344b60" strokeWidth="2" strokeLinecap="round" />
                <circle cx="38" cy="135" r="9" fill="#f8f7f2" stroke="#dbe2db" strokeWidth="1.5" />
                <path d="M35 132h6M38 129v6" stroke="#344b60" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="148" cy="138" r="7" fill="#e8f0e8" stroke="#dbe2db" strokeWidth="1.5" />
              </svg>
            </motion.div>

            <motion.h1
              className="text-2xl sm:text-3xl font-black text-agm-text tracking-tight leading-tight mb-3"
              variants={headingVariants}
            >
              This route isn&apos;t{" "}
              <span className="text-agm-green">mapping</span>{" "}
              to our system.
            </motion.h1>

            <motion.p
              className="text-sm text-agm-muted leading-relaxed mb-8"
              variants={descVariants}
            >
              We couldn&apos;t locate the requested page within the AGM ERP
              platform. It may have been moved, renamed, or no longer exists.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3"
              variants={btnVariants}
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/dashboard">
                  <Button
                    variant="primary"
                    size="md"
                    icon={<HomeIcon className="w-4 h-4" strokeWidth={2.2} />}
                    className="bg-agm-green hover:bg-agm-green-2 text-white font-bold w-full sm:w-auto cursor-pointer"
                  >
                    Return to Dashboard
                  </Button>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => window.history.back()}
                  className="border-agm-border text-agm-muted hover:border-agm-green hover:text-agm-green hover:bg-agm-green-soft font-bold w-full sm:w-auto cursor-pointer"
                >
                  ← Go Back
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

        </div>
      </motion.div>
    </main>
  );
}
