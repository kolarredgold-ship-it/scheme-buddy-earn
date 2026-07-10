import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  href: string;
  tint?: string; // tailwind bg for icon square
}

const CategoryTile = ({ icon: Icon, label, href, tint = "bg-primary/10 text-primary" }: Props) => {
  return (
    <Link
      to={href}
      className="shrink-0 w-[112px] md:w-[132px] rounded-2xl border border-border bg-card p-3 md:p-4 flex flex-col items-center gap-2.5 hover:border-foreground/30 hover:-translate-y-0.5 hover:shadow-sm transition-all"
    >
      <div className={`h-11 w-11 md:h-12 md:w-12 rounded-xl flex items-center justify-center ${tint}`}>
        <Icon className="h-5 w-5 md:h-6 md:w-6" />
      </div>
      <span className="text-[11px] md:text-xs font-semibold text-foreground text-center leading-tight line-clamp-2">
        {label}
      </span>
    </Link>
  );
};

export default CategoryTile;
