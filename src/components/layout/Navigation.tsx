import { Link, useLocation } from "react-router-dom";
import { Grid3X3, PenLine, TrendingUp, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { path: "/", icon: Grid3X3, label: "Grille" },
  { path: "/entry", icon: PenLine, label: "Écrire" },
  { path: "/trends", icon: TrendingUp, label: "Tendances" },
  { path: "/settings", icon: Settings, label: "Paramètres" },
];

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-card border-b-2 border-border shadow-brutal-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-mood-5 border border-border shadow-brutal-sm flex items-center justify-center">
              <span className="font-bold text-lg">J</span>
            </div>
            <span className="font-bold text-xl hidden sm:block">Journal</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 border border-border transition-all duration-150",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-brutal-sm"
                      : "bg-card hover:bg-secondary hover:shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden md:block text-sm font-medium">
                    {item.label}
                  </span>
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 border border-border bg-card hover:bg-destructive hover:text-destructive-foreground transition-all duration-150 hover:shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:block text-sm font-medium">Sortir</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
