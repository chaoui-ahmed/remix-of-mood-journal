import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Entry {
  id: string;
  user_id: string;
  content: string;
  mood_score: number;
  hashtags: string[];
  photo_url: string | null;
  created_at: string;
}

export interface CreateEntryData {
  content: string;
  mood_score: number;
  hashtags: string[];
  photo_url?: string;
}

export function useEntries(year?: number) {
  return useQuery({
    queryKey: ["entries", year],
    queryFn: async () => {
      let query = supabase
        .from("entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (year) {
        const startDate = new Date(year, 0, 1).toISOString();
        const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();
        query = query.gte("created_at", startDate).lte("created_at", endDate);
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
    mutationFn: async (entryData: CreateEntryData) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("entries")
        .insert({
          ...entryData,
          user_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast({
        title: "Entrée sauvegardée",
        description: "Ton journal a été mis à jour.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...entryData
    }: Partial<CreateEntryData> & { id: string }) => {
      const { data, error } = await supabase
        .from("entries")
        .update(entryData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast({
        title: "Entrée mise à jour",
        description: "Les modifications ont été enregistrées.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entries").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      toast({
        title: "Entrée supprimée",
        description: "L'entrée a été supprimée de ton journal.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
