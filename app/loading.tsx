"use client";

import React from "react";
import { ClipLoader } from "react-spinners";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] h-full w-full items-center justify-center p-6 bg-transparent">
      <ClipLoader color="#28633a" size={40} speedMultiplier={0.8} />
    </div>
  );
}
