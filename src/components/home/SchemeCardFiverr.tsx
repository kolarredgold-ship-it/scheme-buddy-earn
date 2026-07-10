import { Link } from "react-router-dom";
import { Landmark, MapPin } from "lucide-react";

interface Props {
  slug: string;
  title: string;
  category: string;
  state: string | null;
  image_url?: string | null;
  categoryLabel: string;
  stateLabel: string;
}

const SchemeCardFiverr = ({ slug, title, category, state, image_url, categoryLabel, stateLabel }: Props) => {
  return (
    <Link
      to={`/scheme/${slug}`}
      className="shrink-0 w-[240px] md:w-[260px] rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group"
    >
      <div className="aspect-[16/10] bg-muted overflow-hidden relative">
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
            <Landmark className="h-8 w-8 text-primary/60" />
          </div>
        )}
        <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-background/90 backdrop-blur px-2 py-0.5 rounded-md text-foreground border border-border">
          {categoryLabel}
        </span>
      </div>
      <div className="p-3.5">
        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 min-h-[2.5rem]">
          {title}
        </h3>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{stateLabel}</span>
        </div>
      </div>
    </Link>
  );
};

export default SchemeCardFiverr;
