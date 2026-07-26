#!/usr/bin/env python3
"""Parse les résultats bruts du balayage Maps (maps_sweep/*.json), dédoublonne
GLOBALEMENT par nom d'entreprise, réattribue chaque fiche à son vrai métier
via sa catégorie Maps (pas le terme de recherche utilisé), puis compare à
l'ensemble des leads déjà connus (toutes tabs confondues) pour isoler les
vraiment nouveaux.
"""
import glob
import json
import re
import unicodedata

PHONE_RE = re.compile(r"0[1-9](?:[\s.]?\d{2}){4}")
RATING_RE = re.compile(r"^(\d,\d)\((\d[\d\s]*|Aucun avis)\)", re.MULTILINE)
STATUS_KEYWORDS = ("Ouvert", "Fermé", "Ferme à", "Rouvre", "Ferme bientôt", "Ouvre à")


def norm(name: str) -> str:
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    name = re.sub(r"[^a-z0-9]", "", name.lower())
    return name


def strip_accents_lower(text: str) -> str:
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()


def parse_card(text: str) -> dict:
    lines = [l for l in text.split("\n") if l.strip()]
    name = lines[0] if lines else ""
    m = RATING_RE.search(text)
    rating, reviews = "", "0"
    if m:
        rating = m.group(1)
        reviews = "0" if m.group(2) == "Aucun avis" else m.group(2).replace(" ", "").replace("\xa0", "")
    phone_m = PHONE_RE.search(text)
    phone = phone_m.group(0) if phone_m else ""

    category, address = "", ""
    if len(lines) > 3:
        line3 = lines[3]
        if not any(kw in line3 for kw in STATUS_KEYWORDS):
            if "·" in line3:
                parts = [p.strip() for p in line3.split("·") if p.strip()]
                category = parts[0] if parts else ""
                address = parts[1] if len(parts) > 1 else ""
            else:
                address = line3.strip()

    return {"name": name.strip(), "rating": rating, "reviews": reviews, "phone": phone,
            "category": category, "address": address}


def parse_single(text: str) -> dict:
    lines = [l for l in text.split("\n") if l.strip()]
    name = lines[0] if lines else ""
    m = re.search(r"(\d,\d)", text)
    rating = m.group(1) if m else ""
    rm = re.search(r"\((\d[\d\s]*)\)|(\d+)\s+avis", text)
    reviews = "0"
    if rm:
        reviews = (rm.group(1) or rm.group(2) or "0").replace(" ", "").replace("\xa0", "")
    phone_m = PHONE_RE.search(text)
    phone = phone_m.group(0) if phone_m else ""
    category = lines[2] if len(lines) > 2 and not any(kw in lines[2] for kw in STATUS_KEYWORDS) else ""
    return {"name": name.strip(), "rating": rating, "reviews": reviews, "phone": phone,
            "category": category, "address": ""}


SEARCH_PREFIX_TO_METIER = {
    "plombier": "Plombiers/Chauffagistes",
    "electricien": "Electriciens",
    "couvreur": "Couvreurs",
    "macon": "Macons",
    "peintre": "Peintres",
    "menuisier": "Menuisiers",
    "carreleur": "Carreleurs",
    "plaquiste": "Plaquistes",
    "chauffagiste": "Chauffagistes Climaticiens",
    "terrassier": "Terrassiers",
}

# Catégorie Maps (telle qu'affichée) -> métier canonique du sheet.
CATEGORY_TO_METIER = {
    "plombier": "Plombiers/Chauffagistes",
    "electricien": "Electriciens",
    "couvreur": "Couvreurs",
    "macon": "Macons",
    "peintreenbatiment": "Peintres",
    "peintre": "Peintres",
    "menuisier": "Menuisiers",
    "atelierdemenuiserie": "Menuisiers",
    "carreleur": "Carreleurs",
    "platriere": "Plaquistes",
    "platrier": "Plaquistes",
    "chauffagiste": "Chauffagistes Climaticiens",
    "entreprisedeterrassement": "Terrassiers",
    "societedetravauxpublics": "Terrassiers",
}

EXCLUDE_CATEGORY_KEYWORDS = [
    "fournisseur", "magasin", "quincaillerie", "location", "grossiste",
    "supermarche", "negociant", "immobilier", "architecte", "assurance",
    "paysagiste", "assainissement", "medecin", "jardinier", "cuisiniste",
    "geometre", "piscine", "borne de recharge", "dechet", "garage automobile",
    "consultant", "station d'epuration", "compagnie des eaux", "vehicule",
    "sante au travail", "genie civil", "entrepot", "restaurant", "hotel",
    "banque", "notaire", "avocat", "comptable", "coiffeur", "pharmacie",
    "ecole", "auto-ecole", "epicerie", "boulangerie", "garage", "concession",
]

# 1) Parse tout, dédoublonne GLOBALEMENT par nom (une fiche peut apparaître
#    dans plusieurs recherches métier/commune différentes).
all_cards = {}  # norm(name) -> rec (garde la première vue, avec sa recherche d'origine)
for f in sorted(glob.glob("projects/leads-btp-perigueux/maps_sweep/*.json")):
    base = f.split("/")[-1].replace(".json", "")
    prefix = base.split("-")[0]
    searched_metier = SEARCH_PREFIX_TO_METIER.get(prefix)
    if not searched_metier:
        continue
    d = json.load(open(f))
    records = []
    if d.get("mode") == "list":
        records = [parse_card(t) for t in d.get("texts", [])]
    elif d.get("mode") == "single":
        r = parse_single(d.get("text", ""))
        if r["name"]:
            records = [r]
    for rec in records:
        if not rec["name"]:
            continue
        key = norm(rec["name"])
        if key not in all_cards:
            rec["searched_as"] = searched_metier
            all_cards[key] = rec

# 2) Réattribue chaque fiche à son vrai métier via sa catégorie Maps.
for rec in all_cards.values():
    cat_key = norm(rec["category"])
    rec["assigned_metier"] = CATEGORY_TO_METIER.get(cat_key, rec["searched_as"])

# 3) Charge tous les leads déjà connus, toutes tabs confondues (un seul set
#    global : un plombier déjà listé sous Plombiers ne doit pas être signalé
#    "nouveau" même s'il est ressorti via une recherche maçon).
existing_all = set()
file_map = {
    "Plombiers/Chauffagistes": "enriched_Plombiers_Chauffagistes.json",
    "Electriciens": "enriched_Electricien.json",
    "Couvreurs": "enriched_Couvreurs.json",
    "Macons": "enriched_Maçons.json",
    "Peintres": "enriched_Peintres.json",
    "Menuisiers": "enriched_Menuisiers.json",
    "Plaquistes": "enriched_Plaquistes.json",
    "Chauffagistes Climaticiens": "enriched_Chauffagistes_Climaticiens.json",
    "Terrassiers": "enriched_Terrassiers.json",
}
for fname in file_map.values():
    d = json.load(open(f"projects/leads-btp-perigueux/{fname}"))
    for row in d["rows"]:
        if row and row[0]:
            existing_all.add(norm(row[0]))

d = json.load(open("/tmp/carreleurs_reread.json"))
for row in d["values"][1:]:
    if row and row[0]:
        existing_all.add(norm(row[0]))

# 4) Nouveaux = pas déjà connu nulle part + catégorie pas exclue.
by_metier = {m: [] for m in set(CATEGORY_TO_METIER.values()) | set(SEARCH_PREFIX_TO_METIER.values())}
skipped_excluded = 0
for key, rec in all_cards.items():
    if key in existing_all:
        continue
    cat_lower = strip_accents_lower(rec["category"])
    if any(kw in cat_lower for kw in EXCLUDE_CATEGORY_KEYWORDS):
        skipped_excluded += 1
        continue
    by_metier[rec["assigned_metier"]].append(rec)

for m in by_metier:
    by_metier[m].sort(key=lambda r: int(r["reviews"]) if r["reviews"].isdigit() else 0)

with open("projects/leads-btp-perigueux/sweep_report.json", "w") as f:
    json.dump(by_metier, f, ensure_ascii=False, indent=2)

print(f"Total fiches uniques vues dans le balayage: {len(all_cards)}")
print(f"Exclues (hors-cible: fournisseur/magasin/etc.): {skipped_excluded}")
print()
print(f"{'Métier':30s}{'NOUVEAU':>10s}{'dont 0 avis':>14s}{'dont 1-5 avis':>16s}")
total_new = 0
for metier, leads in sorted(by_metier.items()):
    zero = sum(1 for l in leads if l["reviews"] == "0")
    one_five = sum(1 for l in leads if l["reviews"].isdigit() and 1 <= int(l["reviews"]) <= 5)
    print(f"{metier:30s}{len(leads):>10d}{zero:>14d}{one_five:>16d}")
    total_new += len(leads)
print(f"\nTOTAL NOUVEAUX LEADS (réattribués, dédoublonnés, filtrés): {total_new}")
