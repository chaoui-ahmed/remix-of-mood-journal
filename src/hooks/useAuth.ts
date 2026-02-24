import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- NOUVELLE FONCTION : Connexion avec Google (et permissions Photos) ---
  // Dans src/hooks/useAuth.t
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // On demande les scopes standards + Photos
      scopes: 'email profile https://www.googleapis.com/auth/photoslibrary.readonly',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent', // Force l'apparition de l'écran de sélection des permissions
        // On renforce la demande de scope ici aussi
        scope: 'email profile https://www.googleapis.com/auth/photoslibrary.readonly',
      },
      redirectTo: `${window.location.origin}/`,
    },
  });
  return { error };
};

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle, // N'oublie pas de l'exporter ici
    signOut,
  };
}