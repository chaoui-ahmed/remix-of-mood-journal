import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast"; // Importation pour les notifications

export interface Profile {
  id: string;
  username: string | null;
  avatar_url?: string | null;
}

// Hook pour récupérer le profil
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id) 
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    retry: false,
  });
}

// ✅ AJOUT : Hook pour mettre à jour le profil (C'est ce qui manquait !)
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // On rafraîchit les données du profil partout dans l'app
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Profil mis à jour",
        description: "Vos modifications ont été enregistrées.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    },
  });
}