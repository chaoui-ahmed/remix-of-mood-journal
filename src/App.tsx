import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Entry from "./pages/Entry";
import Trends from "./pages/Trends"; // ✅ Ajoutez cet import
import Settings from "./pages/Settings"; // ✅ Ajoutez cet import

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  if (!session) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/entry" element={<ProtectedRoute><Entry /></ProtectedRoute>} />
        <Route path="/entry/:id" element={<ProtectedRoute><Entry /></ProtectedRoute>} />
        
        {/* ✅ AJOUTEZ CES DEUX LIGNES ICI */}
        <Route path="/trends" element={<ProtectedRoute><Trends /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;