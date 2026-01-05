import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Entry from "./pages/Entry";
import Trends from "./pages/Trends";
import Settings from "./pages/Settings";

// Composant pour gérer la couleur de fond dynamique
import { ThemeLoader } from "@/components/layout/ThemeLoader";

const queryClient = new QueryClient();

// Composant de protection (redirige vers /auth si pas connecté)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const App = () => {
  // État pour gérer l'apparition de l'étoile filante
  const [showStar, setShowStar] = useState(false);

  useEffect(() => {
    // Vérification de l'heure toutes les secondes
    const checkTime = setInterval(() => {
      const now = new Date();
      // Si il est 11h11
      if (now.getHours() === 11 && now.getMinutes() === 11) or (now.getHours() === 22 && now.getMinutes() === 22) {
        setShowStar(true);
        // On cache l'étoile après 3 secondes (durée de l'animation CSS + marge)
        setTimeout(() => setShowStar(false), 3000);
      }
    }, 1000);

    return () => clearInterval(checkTime);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Élément de l'étoile filante (visible uniquement si showStar est vrai) */}
      {showStar && <div className="shooting-star" />}

      {/* ✅ Le ThemeLoader est placé ici pour surveiller et peindre le fond partout */}
      <ThemeLoader />
      
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          
          {/* Routes Protégées */}
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/entry" element={<ProtectedRoute><Entry /></ProtectedRoute>} />
          <Route path="/entry/:id" element={<ProtectedRoute><Entry /></ProtectedRoute>} />
          <Route path="/trends" element={<ProtectedRoute><Trends /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          
          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;