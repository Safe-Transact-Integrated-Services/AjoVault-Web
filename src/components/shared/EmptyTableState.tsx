type EmptyTableStateProps = {
  title: string;
  description: string;
};

type TableEmptyStateRowProps = EmptyTableStateProps & {
  colSpan: number;
};

const EmptyStateIllustrationSVG = () => (
  <svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-24 w-24 transition-transform duration-300 hover:scale-105"
  >
    <defs>
      <linearGradient id="folderGrad" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" />
        <stop offset="0.5" stopColor="#0284C7" />
        <stop offset="1" stopColor="#0369A1" />
      </linearGradient>
      <linearGradient id="folderFrontGrad" x1="15" y1="45" x2="105" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0EA5E9" stopOpacity="0.9" />
        <stop offset="1" stopColor="#0284C7" stopOpacity="0.95" />
      </linearGradient>
      <linearGradient id="paperGrad" x1="30" y1="25" x2="90" y2="75" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#F1F5F9" />
      </linearGradient>
      <linearGradient id="glowGrad" x1="60" y1="10" x2="60" y2="110" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" stopOpacity="0.2" />
        <stop offset="1" stopColor="#0284C7" stopOpacity="0" />
      </linearGradient>
      <filter id="svgShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0284C7" floodOpacity="0.18" />
      </filter>
    </defs>

    {/* Background Soft Glow Circle */}
    <circle cx="60" cy="60" r="46" fill="url(#glowGrad)" />

    {/* Decorative Sparkles & Dots */}
    <circle cx="22" cy="34" r="3" fill="#38BDF8" opacity="0.6" />
    <circle cx="98" cy="30" r="2.5" fill="#38BDF8" opacity="0.7" />
    <path d="M102 75 L106 79 M106 75 L102 79" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M16 80 L20 84 M20 80 L16 84" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

    <g filter="url(#svgShadow)">
      {/* Folder Back Body */}
      <path
        d="M24 38C24 34.6863 26.6863 32 30 32H48C50.5 32 52.8 33.3 54 35.5L57 41H90C93.3137 41 96 43.6863 96 47V86C96 89.3137 93.3137 92 90 92H30C26.6863 92 24 89.3137 24 86V38Z"
        fill="url(#folderGrad)"
      />

      {/* Floating Paper / Card inside Folder */}
      <rect x="36" y="28" width="48" height="42" rx="6" fill="url(#paperGrad)" transform="rotate(-4 60 49)" />
      <rect x="42" y="36" width="22" height="3" rx="1.5" fill="#CBD5E1" transform="rotate(-4 60 49)" />
      <rect x="42" y="43" width="34" height="2.5" rx="1.25" fill="#E2E8F0" transform="rotate(-4 60 49)" />
      <rect x="42" y="49" width="28" height="2.5" rx="1.25" fill="#E2E8F0" transform="rotate(-4 60 49)" />

      {/* Folder Front Lip */}
      <path
        d="M20 52C20 48.6863 22.6863 46 26 46H94C97.3137 46 100 48.6863 100 52V86C100 89.3137 97.3137 92 94 92H26C22.6863 92 20 89.3137 20 86V52Z"
        fill="url(#folderFrontGrad)"
      />

      {/* Search / Glass Icon Badge on Front */}
      <circle cx="60" cy="69" r="11" fill="#FFFFFF" fillOpacity="0.95" />
      <circle cx="59" cy="68" r="4" stroke="#0284C7" strokeWidth="2" fill="none" />
      <path d="M62 71L65.5 74.5" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);

export const EmptyTableState = ({
  title,
  description,
}: EmptyTableStateProps) => (
  <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/70 bg-card/60 px-6 py-10 text-center shadow-xs">
    <div className="relative mx-auto flex max-w-sm flex-col items-center gap-3">
      <div className="flex items-center justify-center p-1">
        <EmptyStateIllustrationSVG />
      </div>

      <div className="space-y-1">
        <h4 className="font-bold text-foreground text-base">{title}</h4>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

export const TableEmptyStateRow = ({ colSpan, title, description }: TableEmptyStateRowProps) => (
  <tr>
    <td colSpan={colSpan} className="p-4">
      <EmptyTableState title={title} description={description} />
    </td>
  </tr>
);
