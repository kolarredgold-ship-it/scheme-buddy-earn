import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}

const SectionHeader = ({ title, subtitle, href, linkLabel = "See all" }: Props) => {
  return (
    <div className="flex items-end justify-between gap-4 mb-5 md:mb-6">
      <div className="min-w-0">
        <h2
          className="text-xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight"
          style={{ fontFamily: "Plus Jakarta Sans" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs md:text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          to={href}
          className="shrink-0 text-xs md:text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 whitespace-nowrap"
        >
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
