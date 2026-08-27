import { Link } from "react-router-dom";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BRAND } from "@/constants/brand";
import { LogoIcon } from "@/components/brand/Logo";
import { ChevronDown } from "@/lib/icons";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { label: "Services", href: "/services" },
  { label: "Signals", href: "/trading-signals" },
  { label: "Reviews", href: "/reviews" },
  { label: "FAQs", href: "/faqs" },
  { label: "About", href: "/about" },
] as const;

const FOOTER_SECTIONS = [
  {
    title: "Platform",
    links: [
      { label: "Services", href: "/services" },
      { label: "Trading room", href: "/trading-room" },
      { label: "Trading signals", href: "/trading-signals" },
      { label: "World economy", href: "/world-economy" },
      { label: "Brokers", href: "/brokers" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Reviews", href: "/reviews" },
      { label: "Payouts", href: "/payouts" },
      { label: "FAQs", href: "/faqs" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Security", href: "/security" },
      { label: "Holdings", href: "/holdings" },
      { label: "Verify", href: "/verify" },
    ],
  },
] as const;

const LEGAL_LINKS = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Cookies", href: "/cookies" },
] as const;

function FooterAccordion({
  title,
  links,
  defaultOpen = false,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-bg-primary">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-text-tertiary transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ul className="space-y-1 border-t border-border px-4 pb-3 pt-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="block rounded-lg px-2 py-2 text-[13px] text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FinMarketingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="fin-footer relative mt-auto overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-accent)] to-transparent opacity-80"
        aria-hidden
      />

      <div className="container-app py-5 sm:py-8 lg:py-12 pb-[max(1rem,var(--safe-bottom))]">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-primary shadow-sm">
              <LogoIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <span className="block truncate text-sm font-bold text-text-primary">{BRAND.name}</span>
              <span className="block truncate text-[11px] text-text-tertiary">{BRAND.tagline}</span>
            </div>
          </Link>
          <Link
            to="/auth"
            className="fin-btn-primary shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold"
          >
            Join
          </Link>
        </div>

        <div className="scroll-tabs mt-4 flex gap-2 overflow-x-auto pb-0.5 lg:hidden">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="shrink-0 rounded-full border border-border bg-bg-primary px-3.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-[var(--brand-accent)]/40 hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-3 space-y-2 lg:hidden">
          {FOOTER_SECTIONS.map((section, i) => (
            <FooterAccordion
              key={section.title}
              title={section.title}
              links={section.links}
              defaultOpen={i === 0}
            />
          ))}
        </div>

        <div className="hidden lg:block">
          <div className="fin-footer-brand mb-8 rounded-[1.5rem] border border-border bg-bg-primary p-6">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-bg-secondary">
                <LogoIcon className="h-6 w-6" />
              </span>
              <div>
                <span className="block font-bold text-text-primary">{BRAND.name}</span>
                <span className="text-xs text-text-tertiary">{BRAND.tagline}</span>
              </div>
            </Link>
            <p className="mt-4 max-w-md text-[13px] leading-relaxed text-text-secondary">
              {t("footer.tagline", {
                defaultValue:
                  "Institutional-grade trading infrastructure for active traders and professional desks.",
              })}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title}>
                <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
                  {section.title}
                </h4>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        className="block text-[13px] text-text-secondary transition-colors hover:text-text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="fin-footer-bottom mt-5 flex flex-col gap-3 border-t border-border pt-4 text-[11px] text-text-tertiary sm:text-[12px] lg:mt-8 lg:flex-row lg:items-center lg:justify-between lg:pt-6">
          <p className="text-center lg:text-left">
            &copy; {new Date().getFullYear()} {BRAND.legalEntity}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 lg:justify-end">
            {LEGAL_LINKS.map((link, i) => (
              <span key={link.href} className="inline-flex items-center gap-3">
                {i > 0 && <span className="hidden text-text-tertiary sm:inline" aria-hidden>·</span>}
                <Link to={link.href} className="transition-colors hover:text-text-primary">
                  {link.label}
                </Link>
              </span>
            ))}
          </div>

          <p className="hidden text-balance lg:block lg:max-w-xs lg:text-right">
            Markets move fast. Your broker shouldn&apos;t slow you down.
          </p>
        </div>
      </div>
    </footer>
  );
}
