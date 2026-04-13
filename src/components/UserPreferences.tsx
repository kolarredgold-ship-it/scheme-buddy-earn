import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Tag, Check, Settings2 } from "lucide-react";
import { toast } from "sonner";

const INDIAN_STATES = [
  { value: "all", label: "All India" },
  { value: "central", label: "Central Govt" },
  { value: "andhra_pradesh", label: "Andhra Pradesh" },
  { value: "arunachal_pradesh", label: "Arunachal Pradesh" },
  { value: "assam", label: "Assam" },
  { value: "bihar", label: "Bihar" },
  { value: "chhattisgarh", label: "Chhattisgarh" },
  { value: "delhi", label: "Delhi" },
  { value: "goa", label: "Goa" },
  { value: "gujarat", label: "Gujarat" },
  { value: "haryana", label: "Haryana" },
  { value: "himachal_pradesh", label: "Himachal Pradesh" },
  { value: "jammu_kashmir", label: "Jammu & Kashmir" },
  { value: "jharkhand", label: "Jharkhand" },
  { value: "karnataka", label: "Karnataka" },
  { value: "kerala", label: "Kerala" },
  { value: "ladakh", label: "Ladakh" },
  { value: "madhya_pradesh", label: "Madhya Pradesh" },
  { value: "maharashtra", label: "Maharashtra" },
  { value: "manipur", label: "Manipur" },
  { value: "meghalaya", label: "Meghalaya" },
  { value: "mizoram", label: "Mizoram" },
  { value: "nagaland", label: "Nagaland" },
  { value: "odisha", label: "Odisha" },
  { value: "punjab", label: "Punjab" },
  { value: "rajasthan", label: "Rajasthan" },
  { value: "sikkim", label: "Sikkim" },
  { value: "tamil_nadu", label: "Tamil Nadu" },
  { value: "telangana", label: "Telangana" },
  { value: "tripura", label: "Tripura" },
  { value: "uttar_pradesh", label: "Uttar Pradesh" },
  { value: "uttarakhand", label: "Uttarakhand" },
  { value: "west_bengal", label: "West Bengal" },
];

const CATEGORIES = [
  { key: "scholarships", label: "🎓 Scholarships" },
  { key: "farmers", label: "🌾 Farmers" },
  { key: "sc_st", label: "🏷️ SC/ST" },
  { key: "minority", label: "🌙 Minority" },
  { key: "housing", label: "🏠 Housing" },
  { key: "health", label: "❤️ Health" },
  { key: "education", label: "📚 Education" },
  { key: "business", label: "🏢 Business" },
  { key: "govt_jobs", label: "🏛 Govt Jobs" },
];

interface UserPreferencesProps {
  onPreferencesSaved?: (state: string, categories: string[]) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const UserPreferences = ({ onPreferencesSaved, open: externalOpen, onOpenChange: externalOnOpenChange }: UserPreferencesProps) => {
  const { user } = useAuth();
  const [preferredState, setPreferredState] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  useEffect(() => {
    if (!user) return;
    const loadPreferences = async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPreferredState(data.preferred_state || "all");
        setSelectedCategories((data.preferred_categories as string[]) || []);
      }
    };
    loadPreferences();
  }, [user]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        preferred_state: preferredState,
        preferred_categories: selectedCategories,
      }, { onConflict: "user_id" });

    if (error) {
      toast.error("Failed to save preferences");
    } else {
      toast.success("Preferences saved! Your feed is now personalized.");
      onPreferencesSaved?.(preferredState, selectedCategories);
      setOpen(false);
    }
    setSaving(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Personalize Your Feed
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* State Selection */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Your State
            </label>
            <Select value={preferredState} onValueChange={setPreferredState}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select your state" />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                {INDIAN_STATES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Selection */}
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Interested Categories
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => toggleCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategories.includes(cat.key)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {selectedCategories.includes(cat.key) && <Check className="h-3 w-3 inline mr-1" />}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={savePreferences} disabled={saving} className="w-full rounded-xl">
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserPreferences;
