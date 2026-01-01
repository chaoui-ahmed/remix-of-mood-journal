import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  background_color: string;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (profileData: Partial<Omit<Profile, "id" | "user_id" | "created_at" | "updated_at">>) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("user_id", userData.user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Profil mis à jour",
        description: "Tes paramètres ont été enregistrés.",
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
