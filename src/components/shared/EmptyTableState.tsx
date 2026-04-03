import { DatabaseZap } from 'lucide-react';

type EmptyTableStateProps = {
  title: string;
  description: string;
};

type TableEmptyStateRowProps = EmptyTableStateProps & {
  colSpan: number;
};

export const EmptyTableState = ({ title, description }: EmptyTableStateProps) => (
  <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/80 bg-muted/30 px-6 py-12 text-center">
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-border/60"
      viewBox="0 0 800 320"
      fill="none"
      preserveAspectRatio="none"
    >
      <rect x="24" y="28" width="752" height="264" rx="24" stroke="currentColor" strokeDasharray="8 10" />
      <rect x="92" y="88" width="616" height="22" rx="11" fill="currentColor" opacity="0.2" />
      <rect x="92" y="130" width="420" height="18" rx="9" fill="currentColor" opacity="0.14" />
      <rect x="92" y="162" width="356" height="18" rx="9" fill="currentColor" opacity="0.1" />
      <rect x="92" y="220" width="132" height="30" rx="15" fill="currentColor" opacity="0.18" />
      <circle cx="646" cy="166" r="54" fill="currentColor" opacity="0.08" />
      <circle cx="646" cy="166" r="30" fill="currentColor" opacity="0.12" />
    </svg>

    <div className="relative mx-auto flex max-w-sm flex-col items-center gap-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/90 shadow-sm ring-1 ring-border/70">
        <DatabaseZap className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
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
