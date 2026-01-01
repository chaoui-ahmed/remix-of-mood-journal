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
      let query = supabase
        .from("entries")
        .select("*")
        .order("date", { ascending: false });

      if (year) {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        query = query.gte("date", startDate).lte("date", endDate);
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
      if (!id) return null;
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Entry | null;
    },
    enabled: !!id,
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
        .insert({ ...entryData, user_id: userData.user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast({ title: "Succès", description: "Pixel ajouté !" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast({ title: "Succès", description: "Pixel mis à jour !" });
    },
  });
}