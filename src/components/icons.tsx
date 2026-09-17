import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export const BookIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 5.5V20.5A2.5 2.5 0 0 1 6.5 18H20" />
  </svg>
);

export const HeadphonesIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
    <rect x="3" y="13" width="4" height="6" rx="1.5" />
    <rect x="17" y="13" width="4" height="6" rx="1.5" />
  </svg>
);

export const SunIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const HandsIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10" />
    <path d="M10 10V4.5a1.5 1.5 0 0 1 3 0V10" />
    <path d="M13 10.5V6a1.5 1.5 0 0 1 3 0v7c0 3.5-2.3 6-6 6-2.4 0-3.8-1-5-2.7l-2-2.8a1.5 1.5 0 0 1 2.3-1.9L7 12.5" />
  </svg>
);

export const PenIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);

export const BackIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M15 19l-7-7 7-7" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const HeartIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 20s-7-4.3-9.3-8.4C1.2 8.9 2.5 5.5 5.8 5.1c2-.2 3.4 1 4.2 2.2.8-1.2 2.2-2.4 4.2-2.2 3.3.4 4.6 3.8 3.1 6.5C19 15.7 12 20 12 20z" />
  </svg>
);

export const ShareIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3v13" />
    <path d="M8 7l4-4 4 4" />
    <path d="M4 13v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6" />
  </svg>
);

export const BookmarkIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 3h12v18l-6-4-6 4z" />
  </svg>
);

export const NoteIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 4h16v12l-4 4H4z" />
    <path d="M20 16h-4v4" />
    <path d="M8 9h8M8 13h5" />
  </svg>
);

export const AAIcon = (p: P) => (
  <svg {...base} {...p} viewBox="0 0 24 24">
    <path d="M2 18 6 7l4 11M3.2 14.5h5.6" />
    <path d="M13 18 17.5 6 22 18M14.4 14.5h6.2" />
  </svg>
);

export const PlayIcon = (p: P) => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10-6.5a1 1 0 0 0 0-1.72l-10-6.5A1 1 0 0 0 8 5.5z" />
  </svg>
);

export const PauseIcon = (p: P) => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);

export const StopIcon = (p: P) => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

export const NextIcon = (p: P) => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    <path d="M6 5.5v13a1 1 0 0 0 1.5.86L16 14v4.5a1 1 0 0 0 2 0v-13a1 1 0 0 0-2 0V10L7.5 4.64A1 1 0 0 0 6 5.5z" />
  </svg>
);

export const PrevIcon = (p: P) => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    <path d="M18 5.5v13a1 1 0 0 1-1.5.86L8 14v4.5a1 1 0 0 1-2 0v-13a1 1 0 0 1 2 0V10l8.5-5.36A1 1 0 0 1 18 5.5z" />
  </svg>
);

export const ChevronRight = (p: P) => (
  <svg {...base} {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const WifiOffIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M2 8.8a15 15 0 0 1 6-3.2M20 8.8a15 15 0 0 0-5-3M8.5 12.5A8 8 0 0 1 12 11a8 8 0 0 1 3.5 1.5M12 19h.01" />
    <path d="M2 2l20 20" />
  </svg>
);

export const RefreshIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M21 12a9 9 0 1 1-2.6-6.4" />
    <path d="M21 3v5h-5" />
  </svg>
);

export const DownloadIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

export const PlusIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </svg>
);

export const GlobeIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9S9.5 5.5 12 3z" />
  </svg>
);

export const SettingsIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </svg>
);

export const BellIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);
