import React from "react";

interface SectionLabelProps {
  label: string;
  align?: "left" | "center";
}

export default function SectionLabel({
  label,
  align = "center",
}: SectionLabelProps) {
  return (
    <p
      className={`flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-coral ${
        align === "center" ? "justify-center" : "justify-start"
      }`}
    >
      — {label} —
    </p>
  );
}
