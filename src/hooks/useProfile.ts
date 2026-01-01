import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  username: string | null;
  avatar_url?: string | null;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // On cherche par ID (clé primaire liée à l'auth)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id) 
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    retry: false, // Empêche de boucler à l'infini en cas d'erreur
  });
}