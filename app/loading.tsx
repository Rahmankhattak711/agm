"use client";

import React from "react";
import { ClipLoader } from "react-spinners";

export default function Loading() {
  return (
    <div className="flex min-h-[75vh] h-full w-full items-center justify-center p-6 select-none bg-gradient-to-b from-white to-agm-green/[0.03]">
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div className="absolute -inset-6 rounded-full bg-agm-green/10 blur-2xl" />

          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-agm-green-2 via-agm-green to-agm-sidebar shadow-lg shadow-agm-green/20">
            <span className="text-white font-black text-lg tracking-[0.18em]">
              AGM
            </span>
          </div>

          <div className="absolute -inset-3 flex items-center justify-center">
            <ClipLoader color="#28633a" size={92} speedMultiplier={0.7} />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-base font-semibold text-agm-text tracking-tight">
            Loading Workspace
          </h2>
          <p className="text-sm text-agm-muted">
            Syncing financial & operational records
          </p>
        </div>

        <div className="w-40 h-1 rounded-full bg-agm-green/10 overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-agm-green animate-[loading_1.4s_ease-in-out_infinite]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(50%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}
