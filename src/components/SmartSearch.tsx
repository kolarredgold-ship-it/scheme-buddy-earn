import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Sparkles, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  title: string;
  category: string;
  description: string;
  state: string | null;
  image_url: string | null;
  slug: string;
  apply_link: string | null;
  source_website: string | null;
}

interface SmartSearchProps {
  onClose?: () => void;
}

const SmartSearch = ({ onClose }: SmartSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [source, setSource] = useState("");

  const handleSearch = async () => {
    if (query.trim().length < 3) {
      toast.error("Please type at least 3 characters");
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-scheme-search", {
        body: { query: query.trim() },
      });

      if (error) throw error;

      setResults(data.schemes || []);
      setAiSummary(data.ai_summary || "");
      setSource(data.source || "database");
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const stateLabel = (state: string | null) => {
    if (!state) return "";
    return state.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          <input
            type="text"
            placeholder="Try: 'free laptop in Tamil Nadu' or 'farmer subsidy in Maharashtra'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-card border border-primary/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={loading}
          className="h-12 px-5 rounded-xl gap-1.5"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </Button>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-foreground/80">{aiSummary}</p>
            {source === "ai_enriched" && (
              <p className="text-[10px] text-primary mt-1 font-medium">✨ AI discovered new schemes for you</p>
            )}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-40" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/40">
              <CardContent className="p-3 flex gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2 mt-1.5">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <p className="text-[10px] text-center text-primary animate-pulse mt-2">
            ✨ AI is discovering schemes for you...
          </p>
        </div>
      )}

      {/* Results */}
      {hasSearched && !loading && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {results.map((scheme) => (
              <Link
                key={scheme.id}
                to={`/scheme/${scheme.slug}`}
                onClick={onClose}
                className="block"
              >
                <Card className="hover:border-primary/20 transition-colors border-border/40">
                  <CardContent className="p-3 flex gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold line-clamp-1">{scheme.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{scheme.description}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{scheme.category}</Badge>
                        {scheme.state && (
                          <span className="text-[10px] text-muted-foreground">{stateLabel(scheme.state)}</span>
                        )}
                        {!scheme.apply_link && scheme.source_website && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 gap-0.5">
                            <ExternalLink className="h-2.5 w-2.5" /> Dept. Page
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {results.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No schemes found for your query</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try different keywords or state names</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
