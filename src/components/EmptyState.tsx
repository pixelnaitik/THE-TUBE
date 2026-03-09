import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export default function EmptyState({ icon: Icon, title, description, ctaHref, ctaLabel }: EmptyStateProps) {
  return (
    <div className="surface-card reveal-up rounded-2xl px-5 py-10 text-center sm:px-8 sm:py-14">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-blue-300">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="section-title text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="mt-5 inline-flex items-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-strong)]"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}