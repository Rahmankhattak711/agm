import React from "react";
import type { AnyFieldApi } from "@tanstack/react-form";

export interface FieldInfoProps {
  field: AnyFieldApi;
  className?: string;
}

export function FieldInfo({ field, className = "" }: FieldInfoProps) {
  const isTouched = field.state.meta.isTouched;
  const errors = field.state.meta.errors;

  if (!isTouched || !errors || errors.length === 0) {
    return null;
  }

  return (
    <p className={`text-[11px] text-red-600 mt-1 font-medium ${className}`}>
      {errors.map((err) => (typeof err === "object" && err !== null && "message" in err ? (err as any).message : String(err))).join(", ")}
    </p>
  );
}
