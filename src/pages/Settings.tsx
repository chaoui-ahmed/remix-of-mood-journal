import { useState } from "react";
import { Download, Palette } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useEntries } from "@/hooks/useEntries";
import { useToast } from "@/hooks/use-toast";

const bgColors = [
  { name: "Blanc", value: "#FFFFFF" },
  { name: "Crème", value: "#FFF8E7" },
  { name: "Lavande", value: "#F3E8FF" },
  { name: "Menthe", value: "#ECFDF5" },
  { name: "Pêche", value: "#FFF1E6" },
];

export default function Settings() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: entries = [] } = useEntries();
  const { toast } = useToast();

  const handleColorChange = async (color: string) => {
    // Optimistic UI : On peut changer la couleur locale instantanément pour un effet rapide
    document.body.style.backgroundColor = color;
    await updateProfile.mutateAsync({ background_color: color });
    toast({ title: "Couleur mise à jour", description: `Fond changé en ${color}` });
  };

  const handleExport = () => {
    const data = JSON.stringify(entries, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export réussi", description: `${entries.length} entrées exportées.` });
  };

  return (
    // ❌ J'ai retiré "bg-background" ici pour laisser voir la couleur du body
    <div className="min-h-screen"> 
      <Navigation />
      <PageTransition>
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="text-3xl font-bold mb-8">Paramètres</h1>

          <div className="space-y-6">
            {/* Carte Couleur */}
            <div className="bg-card/80 backdrop-blur-sm border border-border shadow-brutal p-6">
              <div className="flex items-center gap-3 mb-4">
                <Palette className="w-5 h-5" />
                <h2 className="text-xl font-bold">Couleur de fond</h2>
              </div>
              <div className="flex gap-3 flex-wrap">
                {bgColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorChange(color.value)}
                    className={`w-16 h-16 rounded-full border-2 border-border shadow-sm transition-all hover:scale-110 ${
                      profile?.background_color === color.value ? "ring-4 ring-black ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Carte Export */}
            <div className="bg-card/80 backdrop-blur-sm border border-border shadow-brutal p-6">
              <div className="flex items-center gap-3 mb-4">
                <Download className="w-5 h-5" />
                <h2 className="text-xl font-bold">Exporter les données</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Télécharge toutes tes entrées au format JSON pour ne jamais les perdre.
              </p>
              <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                Exporter ({entries.length} entrées)
              </Button>
            </div>
          </div>
        </main>
      </PageTransition>
    </div>
  );
}