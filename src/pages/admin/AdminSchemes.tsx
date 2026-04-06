import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const CATEGORIES = ["scholarships", "farmers", "sc_st", "minority", "housing", "health", "education", "employment"];

const STATES = [
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
  { value: "chandigarh", label: "Chandigarh" },
  { value: "puducherry", label: "Puducherry" },
  { value: "andaman_nicobar", label: "Andaman & Nicobar" },
  { value: "dadra_nagar_haveli", label: "Dadra & Nagar Haveli" },
  { value: "lakshadweep", label: "Lakshadweep" },
];

const emptyScheme = { title: "", category: "scholarships", state: "central", description: "", eligibility: "", documents: "", image_url: "", apply_link: "" };

const AdminSchemes = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyScheme);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSchemes = async () => {
    const { data } = await supabase.from("schemes").select("*").order("created_at", { ascending: false });
    if (data) setSchemes(data);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchSchemes(); }, [isAdmin]);

  if (authLoading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;
  if (!isAdmin) return <Navigate to="/" />;

  const openCreate = () => { setForm(emptyScheme); setEditId(null); setDialogOpen(true); };
  const openEdit = (s: any) => {
    setForm({ title: s.title, category: s.category, state: s.state || "central", description: s.description, eligibility: s.eligibility || "", documents: s.documents || "", image_url: s.image_url || "", apply_link: s.apply_link || "" });
    setEditId(s.id);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) { toast.error("Title and description are required"); return; }
    setSaving(true);
    if (editId) {
      const { error } = await supabase.from("schemes").update(form).eq("id", editId);
      if (error) toast.error("Failed to update"); else toast.success("Scheme updated");
    } else {
      const { error } = await supabase.from("schemes").insert(form);
      if (error) toast.error("Failed to create"); else toast.success("Scheme created");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchSchemes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this scheme?")) return;
    const { error } = await supabase.from("schemes").delete().eq("id", id);
    if (error) toast.error("Failed to delete"); else { toast.success("Deleted"); fetchSchemes(); }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Manage Schemes</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Scheme</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? "Edit Scheme" : "Add New Scheme"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Eligibility</label>
                  <Textarea rows={3} value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Documents Required</label>
                  <Textarea rows={3} value={form.documents} onChange={(e) => setForm({ ...form, documents: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Image URL</label>
                  <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Apply Link</label>
                  <Input value={form.apply_link} onChange={(e) => setForm({ ...form, apply_link: e.target.value })} />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Saving..." : editId ? "Update Scheme" : "Create Scheme"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schemes.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.title}</TableCell>
                      <TableCell>{s.category}</TableCell>
                      <TableCell className="hidden md:table-cell">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminSchemes;
