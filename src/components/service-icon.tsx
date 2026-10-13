import { Construction, Droplets, Hammer, House, ShieldCheck, Sparkles, Wrench, type LucideIcon } from "lucide-react";

// Picks an icon from the service name; unknown services get a generic one.
const icons: [RegExp, LucideIcon][] = [
  [/repair/i, Wrench],
  [/install|replace/i, House],
  [/guard/i, ShieldCheck],
  [/gutter/i, Droplets],
  [/chimney/i, Construction],
  [/renovat/i, Hammer],
];

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons.find(([pattern]) => pattern.test(name))?.[1] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
