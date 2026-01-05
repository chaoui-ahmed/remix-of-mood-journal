import { useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";

export function ThemeLoader() {
  const { data: profile } = useProfile();

  useEffect(() => {
    if (profile?.background_color) {
      // On applique la couleur directement sur le corps de la page
      document.body.style.backgroundColor = profile.background_color;
      // On s'assure que l'élément racine hérite de la transparence
      const root = document.getElementById("root");
      if (root) root.style.backgroundColor = "transparent";
    }
  }, [profile?.background_color]);

  return null; // Ce composant est invisible
}