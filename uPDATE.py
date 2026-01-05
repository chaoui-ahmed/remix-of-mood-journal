import os
import subprocess

# --- CONFIGURATION ---
# Le chemin vers le fichier à modifier
# ✅ CORRECT
TARGET_FILE = "src/pages/Index.tsx"
# La partie fixe de la ligne qu'on cherche pour être sûr de remplacer la bonne
# (Assure-toi que cette phrase est UNIQUE dans le fichier)
SEARCH_PATTERN = "✨✨✨✨✨"
# ---------------------

def update_file(new_text):
    # 1. Lire le fichier
    with open(TARGET_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # 2. Trouver et remplacer la ligne
    new_lines = []
    found = False
    for line in lines:
        if SEARCH_PATTERN in line:
            # On garde l'indentation (les espaces au début)
            indentation = line[:line.find('<')]
            # On suppose que le texte est dans une balise simple comme <p> ou <h2>
            # On reconstruit la ligne (adapte les balises si besoin !)
            new_line = f'{indentation}<p className="text-muted-foreground mb-8">{new_text}</p>\n'
            new_lines.append(new_line)
            found = True
            print(f"✅ Ligne trouvée et remplacée par : {new_text}")
        else:
            new_lines.append(line)

    if not found:
        print("❌ ERREUR : Impossible de trouver la ligne à remplacer.")
        return False

    # 3. Écrire le fichier modifié
    with open(TARGET_FILE, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    return True

def git_push(commit_message):
    try:
        print("\n--- Git Operations ---")
        subprocess.run(["git", "add", TARGET_FILE], check=True)
        print("✅ git add")
        subprocess.run(["git", "commit", "-m", commit_message], check=True)
        print(f"✅ git commit -m '{commit_message}'")
        # Décommente la ligne suivante pour pousser vraiment sur GitHub
        subprocess.run(["git", "push", "origin", "main"], check=True)
        print("✅ git push (Simulé - décommente dans le script pour activer)")
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur Git : {e}")

# --- MAIN ---
if __name__ == "__main__":
    print("--- Mise à jour du sous-titre Pixels ---")
    new_subtitle = input("Entre le nouveau sous-titre : ")

    if new_subtitle.strip():
        if update_file(new_subtitle):
            commit_msg = f"feat(wording): update homepage subtitle to '{new_subtitle}'"
            git_push(commit_msg)
            print("\n✨ Terminé ! ✨")
    else:
        print("Texte vide. Abandon.")