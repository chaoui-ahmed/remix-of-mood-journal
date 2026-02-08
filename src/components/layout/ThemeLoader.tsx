import { useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";

export function ThemeLoader() {
  const { data: profile } = useProfile();
  const [showHearts, setShowHearts] = useState(false);

  useEffect(() => {
    const today = new Date();
    const month = today.getMonth(); // 0 = Janvier, 1 = Février
    const day = today.getDate();

    // Logique Saint Valentin : du 8 Février au 15 Février
    // (J'ai mis 8 pour que ça marche avec ta carte à gratter dès maintenant)
    const isValentineWeek = month === 1 && day >= 8 && day <= 15;
    
    // NOUVELLE VERIFICATION : Est-ce que le ticket a été gratté ?
    const hasPlayed = localStorage.getItem("scratch_card_played") === "true";

    // ON AFFICHE LE THEME ROSE UNIQUEMENT SI C'EST LA SEMAINE ET QUE C'EST GAGNÉ
    if (isValentineWeek && hasPlayed) {
      document.body.classList.add("valentine-theme");
      document.body.style.backgroundColor = ""; // Reset inline style
      const root = document.getElementById("root");
      if (root) root.style.backgroundColor = "";

      // Active les cœurs
      setShowHearts(true);

      // Désactive les cœurs après 5 secondes pour ne pas gêner la lecture
      const timer = setTimeout(() => {
        setShowHearts(false);
      }, 5000);

      return () => clearTimeout(timer);

    } else {
      document.body.classList.remove("valentine-theme");
      
      // Application de la couleur utilisateur si définie (Comportement normal)
      if (profile?.background_color) {
        document.body.style.backgroundColor = profile.background_color;
        const root = document.getElementById("root");
        if (root) root.style.backgroundColor = "transparent";
      }
    }
  }, [profile?.background_color]);

  if (!showHearts) return null;

  // Génère 20 cœurs avec des positions et vitesses aléatoires
  return (
    <div className="hearts-container">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="heart-falling"
          style={{
            left: `${Math.random() * 100}vw`,
            animationDuration: `${Math.random() * 2 + 3}s`, // Entre 3 et 5 secondes
            animationDelay: `${Math.random() * 2}s`, // Départ décalé
            fontSize: `${Math.random() * 20 + 20}px` // Taille variable
          }}
        >
          {["❤️", "💖", "💘", "💝"][Math.floor(Math.random() * 4)]}
        </div>
      ))}
    </div>
  );
}