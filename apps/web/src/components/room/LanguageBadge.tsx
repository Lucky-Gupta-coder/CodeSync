import React from "react";
import { RoomLanguage } from "@codesync/types";

interface LanguageConfig {
  displayName: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: React.ReactNode;
}

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  [RoomLanguage.JAVASCRIPT]: {
    displayName: "JavaScript",
    bgClass: "bg-yellow-500/10",
    textClass: "text-yellow-400",
    borderClass: "border-yellow-500/20",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h18v18H3V3zm10.5 12.5c0-.83.67-1.5 1.5-1.5.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5c-.83 0-1.5-.67-1.5-1.5zm-5 0c0-.83.67-1.5 1.5-1.5.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5c-.83 0-1.5-.67-1.5-1.5z" />
      </svg>
    ),
  },
  [RoomLanguage.TYPESCRIPT]: {
    displayName: "TypeScript",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/20",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h18v18H3V3zm9.5 10.5h-2v4h-2v-4h-2v-2h6v2zm6 2c0 1.1-.9 2-2 2h-3v-2h3v-1h-2c-1.1 0-2-.9-2-2v-1c0-1.1.9-2 2-2h3v2h-3v1h2c1.1 0 2 .9 2 2v1z" />
      </svg>
    ),
  },
  [RoomLanguage.PYTHON]: {
    displayName: "Python",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/20",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 6 4 6 6v3h6v1H5c-2 0-3 1-3 3.5S3 17 5 17h2v-2c0-1.5 1-3 3-3h4c1.5 0 3-1 3-3V6c0-2-.48-4-5-4zm-2.5 3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM12 22c5.52 0 6-2 6-4v-3h-6v-1h7c2 0 3-1 3-3.5S21 7 19 7h-2v2c0 1.5-1 3-3 3h-4c-1.5 0-3 1-3 3v3c0 2 .48 4 5 4zm2.5-3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
      </svg>
    ),
  },
  [RoomLanguage.JAVA]: {
    displayName: "Java",
    bgClass: "bg-orange-500/10",
    textClass: "text-orange-400",
    borderClass: "border-orange-500/20",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 19c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3H4v3zm16-9h-2V7c0-1.1-.9-2-2-2H8C6.9 5 6 5.9 6 7v3H4c-1.1 0-2 .9-2 2v2h20v-2c0-1.1-.9-2-2-2zM8 7h8v3H8V7z" />
      </svg>
    ),
  },
  [RoomLanguage.CPP]: {
    displayName: "C++",
    bgClass: "bg-cyan-500/10",
    textClass: "text-cyan-400",
    borderClass: "border-cyan-500/20",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
      </svg>
    ),
  },
  [RoomLanguage.C]: {
    displayName: "C",
    bgClass: "bg-slate-500/10",
    textClass: "text-slate-300",
    borderClass: "border-slate-500/20",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
      </svg>
    ),
  },
  [RoomLanguage.GO]: {
    displayName: "Go",
    bgClass: "bg-sky-500/10",
    textClass: "text-sky-400",
    borderClass: "border-sky-500/20",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  [RoomLanguage.RUST]: {
    displayName: "Rust",
    bgClass: "bg-amber-600/10",
    textClass: "text-amber-400",
    borderClass: "border-amber-600/20",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zm0 9L2 16l10 5 10-5-10-5z" />
      </svg>
    ),
  },
  kotlin: {
    displayName: "Kotlin",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-400",
    borderClass: "border-purple-500/20",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 2h20L12 12 2 22V2z" />
      </svg>
    ),
  },
  swift: {
    displayName: "Swift",
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-400",
    borderClass: "border-rose-500/20",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
    ),
  },
  other: {
    displayName: "Other",
    bgClass: "bg-indigo-500/10",
    textClass: "text-indigo-400",
    borderClass: "border-indigo-500/20",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
      </svg>
    ),
  },
};

interface LanguageBadgeProps {
  language: string;
  size?: "sm" | "md";
}

export const LanguageBadge: React.FC<LanguageBadgeProps> = ({ language, size = "md" }) => {
  const normalizedKey = language.toLowerCase();
  const config = LANGUAGE_CONFIGS[normalizedKey] ||
    LANGUAGE_CONFIGS[normalizedKey as RoomLanguage] || {
      displayName: language.toUpperCase(),
      bgClass: "bg-indigo-500/10",
      textClass: "text-indigo-400",
      borderClass: "border-indigo-500/20",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
        </svg>
      ),
    };

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[10px] gap-1" : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClasses}`}
    >
      {config.icon}
      <span>{config.displayName}</span>
    </span>
  );
};
