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
    return <div className="flex h-screen items-center justify-center font-bold">Chargement...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const App = () => {
  const [showEffects, setShowEffects] = useState(false);

  useEffect(() => {
    const checkMirrorTime = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Se déclenche si l'heure est égale aux minutes (ex: 10:10, 11:11, 22:22)
      if (hours === minutes) {
        setShowEffects(true);
      } else {
        setShowEffects(false);
      }
    }, 1000);

    return () => clearInterval(checkMirrorTime);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeLoader />
      
      {/* EFFET : Lumière Arc-en-ciel subtile (Arrière-plan : z-index -1) */}
      {showEffects && (
        <div className="subtle-rainbow-bg">
          <div className="h"></div>
          <div className="v"></div>
          {[...Array(25)].map((_, i) => (
            <div key={i} className="rainbow"></div>
          ))}
        </div>
      )}

      {/* EFFET : Pluie d'étoiles filantes noires (Premier plan : z-index 9999) */}
      {showEffects && (
        <div className="shooting-stars-wrapper">
          {[...Array(10)].map((_, i) => (
            <span key={i}></span>
          ))}
        </div>
      )}
      
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