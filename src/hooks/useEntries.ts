import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Entry = Database['public']['Tables']['entries']['Row'];
type InsertEntry = Database['public']['Tables']['entries']['Insert'];

export function useEntries(year?: number) {
  return useQuery({
    queryKey: ["entries", year],
    queryFn: async () => {
      let query = supabase.from("entries").select("*").order("date", { ascending: false });
      if (year) {
        query = query.gte("date", `${year}-01-01`).lte("date", `${year}-12-31`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Entry[];
    },
  });
}

export function useEntry(id: string | undefined) {
  return useQuery({
    queryKey: ["entry", id],
    queryFn: async () => {
      if (!id || id === "new") return null;
      const { data, error } = await supabase.from("entries").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Entry | null;
    },
    enabled: !!id && id !== "new",
  });
}

export function useCreateEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entryData: InsertEntry) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non connecté");

      // ✅ UPSERT : Crée ou remplace si la date existe déjà
      const { data, error } = await supabase
        .from("entries")
        .upsert(
          { ...entryData, user_id: userData.user.id },
          { onConflict: 'user_id, date' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast({ title: "Succès", description: "Ton pixel a été mis à jour !" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });
}

// useUpdateEntry reste utile pour les modifications via ID direct
export function useUpdateEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...entryData }: { id: string } & Partial<InsertEntry>) => {
      const { data, error } = await supabase
        .from("entries")
        .update(entryData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast({ title: "Succès", description: "Modification enregistrée !" });
    },
  });
}