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
      // ✅ CHANGEMENT : On trie par 'updated_at' (dernière modification)
      let query = supabase
        .from("entries")
        .select("*")
        .order("updated_at", { ascending: false });

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
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("id", id)
        .maybeSingle();
        
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
      toast({ title: "Succès", description: "Pixel enregistré !" });
    },
    onError: (error: any) => {
      console.error("Erreur create:", error);
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de créer le pixel.", 
        variant: "destructive" 
      });
    },
  });
}

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["entry", variables.id] });
      toast({ title: "Succès", description: "Modification enregistrée !" });
    },
    onError: (error: any) => {
      console.error("Erreur update:", error);
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de modifier le pixel.", 
        variant: "destructive" 
      });
    },
  });
}

// ✅ NOUVEAU HOOK : Suppression
export function useDeleteEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Rafraîchir la liste des entrées pour faire disparaître celle supprimée
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast({ title: "Supprimé", description: "Le pixel a été effacé définitivement." });
    },
    onError: (error: any) => {
      console.error("Erreur delete:", error);
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de supprimer le pixel.", 
        variant: "destructive" 
      });
    },
  });
}