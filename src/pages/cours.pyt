import streamlit as st
import pandas as pd

# -----------------------------------------------------------------------------
# 1. CONFIGURATION & DONNÉES
# -----------------------------------------------------------------------------

st.set_page_config(page_title="Sélecteur de Cours - Spring 2026", layout="wide")

# Définition des créneaux horaires basés sur l'image
# Logique : Chaque demi-journée (AM/PM) est divisée en 'Top' (Haut), 'Bot' (Bas) ou 'Full' (Tout le créneau).
# Conflict Logic : 'Full' bloque tout. 'Top' bloque 'Top'. 'Bot' bloque 'Bot'.
COURSE_DATA = {
    # --- Advanced in Machine Learning ---
    "DeepLearn": {"name": "Deep Learning", "unit": "AdvML", "weight": 0.5, "day": "Tue", "period": "AM", "subslot": "Top"},
    "ASI":       {"name": "Adv. Stat. Inference", "unit": "AdvML", "weight": 0.5, "day": "Wed", "period": "PM", "subslot": "Top"},

    # --- Applications in Data Science ---
    "APPIOT":    {"name": "IoT App Protocols", "unit": "DataSci", "weight": 0.25, "day": "Tue", "period": "PM", "subslot": "Bot"},
    "AppStat":   {"name": "Applied Statistics", "unit": "DataSci", "weight": 0.25, "day": "Thu", "period": "AM", "subslot": "Bot"},
    "FormalMet": {"name": "Formal Methods", "unit": "DataSci", "weight": 0.25, "day": "Thu", "period": "AM", "subslot": "Bot"},
    "ImSecu":    {"name": "Imaging Security", "unit": "DataSci", "weight": 0.25, "day": "Mon", "period": "PM", "subslot": "Bot"},
    "Speech":    {"name": "Speech Processing", "unit": "DataSci", "weight": 0.25, "day": "Fri", "period": "AM", "subslot": "Top"},
    "WebInt":    {"name": "Web Interaction", "unit": "DataSci", "weight": 0.25, "day": "Fri", "period": "AM", "subslot": "Top"},

    # --- Humanities ---
    "Business":  {"name": "Business Simulation", "unit": "Humanities", "weight": 1.0, "day": "Fri", "period": "PM", "subslot": "Top"},
    "Law":       {"name": "Intro to Law", "unit": "Humanities", "weight": 0.5, "day": "Mon", "period": "AM", "subslot": "Bot"},
    "ProjMan":   {"name": "Project Management", "unit": "Humanities", "weight": 1.0, "day": "Mon", "period": "AM", "subslot": "Full"},
    "WebStra":   {"name": "Web Strategy", "unit": "Humanities", "weight": 0.5, "day": "Fri", "period": "PM", "subslot": "Bot"},

    # --- Opening 2 (Courses not listed above or shared) ---
    # Note: Certains cours sont partagés. On définit ici leur créneau par défaut.
    "Radio":     {"name": "Radio Engineering", "unit": "Opening", "weight": 1.0, "day": "Wed", "period": "AM", "subslot": "Full"},
    "CompMeth":  {"name": "Comp. Methods", "unit": "Opening", "weight": 1.0, "day": "Mon", "period": "PM", "subslot": "Full"},
    "SP4Com":    {"name": "Signal Proc. Comm", "unit": "Opening", "weight": 1.0, "day": "Tue", "period": "PM", "subslot": "Full"},
    "RevMal":    {"name": "Reverse Eng. Malware", "unit": "Opening", "weight": 1.0, "day": "Tue", "period": "AM", "subslot": "Bot"},
    "PlanTP":    {"name": "Transportation Plan", "unit": "Opening", "weight": 0.5, "day": "Tue", "period": "AM", "subslot": "Bot"},
    "TraffEEc":  {"name": "Traffic Efficiency", "unit": "Opening", "weight": 0.5, "day": "Tue", "period": "AM", "subslot": "Bot"},
    "HWSec":     {"name": "Hardware Security", "unit": "Opening", "weight": 0.5, "day": "Wed", "period": "AM", "subslot": "Bot"},
    "WiSec":     {"name": "Wireless Security", "unit": "Opening", "weight": 0.5, "day": "Wed", "period": "AM", "subslot": "Bot"},
    "DigiCom2":  {"name": "Digital Comm 2", "unit": "Opening", "weight": 0.5, "day": "Wed", "period": "PM", "subslot": "Bot"},
    "InfoTheo1": {"name": "Info Theory 1", "unit": "Opening", "weight": 0.0, "day": "Wed", "period": "PM", "subslot": "Bot"}, # Weight not in text, assumed 0 or elective
    "DigitalSystems": {"name": "Digital Systems", "unit": "Opening", "weight": 1.0, "day": "Thu", "period": "AM", "subslot": "Top"},
    "QuantiP":   {"name": "Quantum Info Proc", "unit": "Opening", "weight": 1.0, "day": "Thu", "period": "AM", "subslot": "Bot"}, # Visually below DigitalSystems
    "IntroStat": {"name": "Intro Statistics", "unit": "Opening", "weight": 0.0, "day": "Thu", "period": "AM", "subslot": "Bot"}, # Weight missing in text
    "MobiCore":  {"name": "MobiCore", "unit": "Opening", "weight": 0.5, "day": "Fri", "period": "AM", "subslot": "Bot"},
    "MobWat":    {"name": "Wireless Access Tech", "unit": "Opening", "weight": 0.5, "day": "Fri", "period": "AM", "subslot": "Bot"},
    "TelcoAI":   {"name": "Telco AI", "unit": "Opening", "weight": 0.5, "day": "Mon", "period": "PM", "subslot": "Bot"},
    "Malcom":    {"name": "ML for Comms", "unit": "Opening", "weight": 1.0, "day": "Mon", "period": "PM", "subslot": "Bot"},
    "ProtIOT":   {"name": "IoT Comm Protocols", "unit": "Opening", "weight": 0.5, "day": "Tue", "period": "PM", "subslot": "Bot"},
    "Aware":     {"name": "Awareness", "unit": "Opening", "weight": 0.0, "day": "Mon", "period": "AM", "subslot": "Bot"},
}

# Mapping des unités pour l'affichage
UNITS_CONFIG = {
    "AdvML": {"label": "Advanced Machine Learning (10 ECTS)", "min_weight": 1.0, "courses": ["ASI", "DeepLearn"]},
    "DataSci": {"label": "Applications in Data Science (10 ECTS)", "min_weight": 1.0, "courses": ["APPIOT", "AppStat", "FormalMet", "ImSecu", "Speech", "WebInt"]},
    "Humanities": {"label": "Humanities & Social Sciences (4 ECTS)", "min_weight": 2.0, "courses": ["Business", "Law", "ProjMan", "WebStra"]},
    "Opening": {"label": "Opening 2 (5 ECTS)", "min_weight": 2.5, "courses": []} # List populated dynamically below
}

# Remplir la liste Opening avec tous les cours qui ne sont pas "Core" dans les autres unités
# ou qui sont explicitement listés dans le texte 'Opening'
all_opening_keys = [k for k, v in COURSE_DATA.items() if v['unit'] == 'Opening']
# Ajouter les cours des autres unités qui peuvent aussi servir d'ouverture si non choisis en core (optionnel, ici on simplifie)
UNITS_CONFIG["Opening"]["courses"] = sorted(all_opening_keys)


# -----------------------------------------------------------------------------
# 2. FONCTIONS UTILITAIRES
# -----------------------------------------------------------------------------

def check_conflicts(selected_courses):
    """
    Vérifie les conflits d'horaires.
    Retourne une liste de messages d'alerte.
    """
    schedule = {}
    conflicts = []
    
    for code in selected_courses:
        data = COURSE_DATA.get(code)
        if not data: continue
        
        slot_key = f"{data['day']} {data['period']}"
        subslot = data['subslot']
        
        if slot_key not in schedule:
            schedule[slot_key] = []
        
        # Vérification avec les cours déjà dans ce créneau
        for existing_code, existing_subslot in schedule[slot_key]:
            # Conflit si :
            # 1. Même subslot (ex: Top vs Top)
            # 2. L'un est Full (Full bloque Top et Bot)
            if subslot == existing_subslot or subslot == "Full" or existing_subslot == "Full":
                conflicts.append(f"⚠️ **CONFLIT :** {COURSE_DATA[code]['name']} et {COURSE_DATA[existing_code]['name']} ({slot_key})")
        
        schedule[slot_key].append((code, subslot))
    
    return conflicts

# -----------------------------------------------------------------------------
# 3. INTERFACE STREAMLIT
# -----------------------------------------------------------------------------

st.title("🎓 Assistant Choix de Cours - Spring 2026")
st.markdown("Cochez les cours que vous souhaitez suivre pour vérifier les poids et les conflits horaires.")

col_left, col_right = st.columns([1, 1])

selected_courses = []
unit_weights = {u: 0.0 for u in UNITS_CONFIG}

with col_left:
    st.header("1. Sélection par Unité")
    
    # --- Génération des formulaires pour chaque unité ---
    for unit_key, config in UNITS_CONFIG.items():
        with st.expander(config["label"], expanded=(unit_key=="AdvML")):
            st.caption(f"Objectif suggéré : Poids cumulé ~ {config['min_weight']}")
            
            # Pour l'unité Opening, on permet de choisir aussi des cours des autres listes s'ils ne sont pas pris ?
            # Pour simplifier, on affiche la liste stricte définie plus haut.
            
            for code in config["courses"]:
                course = COURSE_DATA.get(code)
                if not course: continue
                
                label = f"**{course['name']}** ({code})"
                meta = f" | {course['day']} {course['period']} ({course['subslot']}) | W: {course['weight']}"
                
                # Checkbox
                if st.checkbox(label + meta, key=f"chk_{unit_key}_{code}"):
                    if code not in selected_courses:
                        selected_courses.append(code)
                        unit_weights[unit_key] += course['weight']
                    else:
                        st.warning(f"Le cours {code} est déjà sélectionné ailleurs.")

with col_right:
    st.header("2. Résumé & Conflits")
    
    # --- Analyse des conflits ---
    conflicts = check_conflicts(selected_courses)
    
    if conflicts:
        st.error(f"Il y a {len(conflicts)} conflit(s) d'horaire !")
        for c in conflicts:
            st.markdown(c)
    else:
        if len(selected_courses) > 0:
            st.success("✅ Aucun conflit d'horaire détecté.")
        else:
            st.info("Commencez par sélectionner des cours à gauche.")

    st.divider()
    
    # --- Progression des Poids ---
    st.subheader("Progression des Objectifs (Weights)")
    
    for unit_key, config in UNITS_CONFIG.items():
        current = unit_weights[unit_key]
        target = config["min_weight"]
        progress = min(current / target, 1.0) if target > 0 else 0
        
        st.write(f"**{unit_key}** : {current:.2f} / {target}")
        st.progress(progress)
        if current >= target:
            st.caption("✅ Objectif atteint")
        else:
            st.caption("❌ Insuffisant")

    st.divider()

    # --- Liste Récapitulative ---
    st.subheader("Mon Emploi du Temps")
    if selected_courses:
        # Créer un petit dataframe pour l'affichage
        schedule_data = []
        for code in selected_courses:
            c = COURSE_DATA[code]
            schedule_data.append({
                "Jour": c['day'],
                "Période": c['period'],
                "Cours": c['name'],
                "Type": c['subslot'],
                "Unit": c['unit']
            })
        
        df = pd.DataFrame(schedule_data)
        # Ordre de tri personnalisé pour les jours
        days_order = ["Mon", "Tue", "Wed", "Thu", "Fri"]
        df['Jour'] = pd.Categorical(df['Jour'], categories=days_order, ordered=True)
        df = df.sort_values(["Jour", "Période"])
        
        st.table(df)
    else:
        st.write("Aucun cours sélectionné.")

# -----------------------------------------------------------------------------
# Instructions Footer
# -----------------------------------------------------------------------------
st.markdown("---")
st.markdown("""
**Note sur la logique des conflits :**
* **Full** : Occupe toute la demi-journée (ex: ProjMan, Radio). Bloque tout autre cours ce matin/après-midi là.
* **Top / Bot** : L'emploi du temps divise souvent les cases en deux (Haut/Bas). Le script suppose que vous pouvez prendre un cours 'Top' et un cours 'Bot' simultanément (séquentiels), mais pas deux 'Top' ou deux 'Bot'.
* *Vérifiez toujours manuellement avec l'image officielle pour les cas limites.*
""")