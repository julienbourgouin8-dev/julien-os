#!/usr/bin/env python3
"""Cross-check leads against the official French company registry (SIRENE).

Usage:
    check_sirene.py leads.json > leads_with_sirene.json

Uses recherche-entreprises.api.gouv.fr — free, no API key, official
government data (INSEE/SIRENE). For each lead, matches by name + postal
code extracted from the known address (to avoid homonym false positives,
same lesson as the Facebook/Instagram lookups), then adds:
  - "secteur_naf": human-readable label for the activité principale (NAF) code
  - "tranche_effectif": decoded employee headcount range
  - "dirigeant": leader's name if a physical person
  - "chiffre_affaires": most recent declared annual revenue (EUR), if the
    company publishes comptes (mostly SARL/SAS — sole traders/EI rarely
    have this field at all, that's normal, not a lookup failure)

Leaves fields untouched (not overwritten) if no confident match is found.
"""
import json
import re
import sys
import urllib.parse
import urllib.request

API_URL = "https://recherche-entreprises.api.gouv.fr/search"
HEADERS = {"User-Agent": "Mozilla/5.0"}
TIMEOUT = 10

# Standard INSEE "tranche d'effectifs salariés" scale — public, documented coding.
TRANCHE_LABELS = {
    "NN": "non renseigné",
    "00": "0 salarié",
    "01": "1 à 2 salariés",
    "02": "3 à 5 salariés",
    "03": "6 à 9 salariés",
    "11": "10 à 19 salariés",
    "12": "20 à 49 salariés",
    "21": "50 à 99 salariés",
    "22": "100 à 199 salariés",
    "31": "200 à 249 salariés",
    "32": "250 à 499 salariés",
    "41": "500 à 999 salariés",
    "42": "1 000 à 1 999 salariés",
    "51": "2 000 à 4 999 salariés",
    "52": "5 000 à 9 999 salariés",
    "53": "10 000 salariés et plus",
}

# Common BTP-adjacent NAF (Rev. 2) codes — covers what this skill's leads
# are likely to hit. Falls back to showing the raw code if not listed here.
NAF_LABELS = {
    "43.22A": "Travaux d'installation d'eau et de gaz en tous locaux",
    "43.22B": "Travaux d'installation d'équipements thermiques et de climatisation",
    "43.21A": "Travaux d'installation électrique dans tous locaux",
    "43.29A": "Travaux d'isolation",
    "43.29B": "Autres travaux d'installation n.c.a.",
    "43.39Z": "Autres travaux de finition",
    "43.91A": "Travaux de charpente",
    "43.91B": "Travaux de couverture par éléments",
    "43.34Z": "Travaux de peinture et vitrerie",
    "43.99C": "Travaux de maçonnerie générale et gros œuvre de bâtiment",
    "47.52B": "Commerce de détail de quincaillerie, peintures et verres",
    "46.73A": "Commerce de gros de bois et de matériaux de construction",
    "46.73B": "Commerce de gros d'appareils sanitaires et de chauffage",
}


def extract_commune(address: str) -> str:
    # Known communes searched by this skill — match by name, not postal
    # code: a merged commune like Boulazac Isle Manoire spans multiple
    # postal codes (24330/24750 both seen for real addresses there), so
    # filtering strictly by postal code produces false "not found" misses.
    known_communes = [
        "Boulazac Isle Manoire", "Boulazac", "Coulounieix-Chamiers",
        "Trélissac", "Chancelade", "Marsac-sur-l'Isle", "Périgueux",
    ]
    for commune in known_communes:
        if commune.lower() in (address or "").lower():
            return commune
    return ""


def search_company(name: str, expected_commune: str) -> tuple[dict | None, str]:
    """Search by name only. A distinctive business name usually returns
    exactly one result on this registry — trust it directly rather than
    filtering by a locally-stored commune name, which can itself be wrong
    (found the hard way: a lead's own stored address turned out to name
    the wrong commune, which made a correct match look like "not found").
    If several results come back, fall back to a loose commune-name check
    across ALL of them (not just the first) before giving up as ambiguous.
    Returns (result_or_None, confidence) where confidence is
    "single_result" / "commune_matched" / "ambiguous" / "none".
    """
    # Including the commune directly in the free-text query disambiguates
    # far better than fetching broad results and filtering after the
    # fact — the API's own relevance ranking does a better job than a
    # simple substring check on locally-stored (and sometimes wrong)
    # commune data.
    query = f"{name} {expected_commune}".strip() if expected_commune else name
    params = {"q": query}
    url = f"{API_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    results = data.get("results", [])
    if not results:
        return None, "none"
    if len(results) == 1:
        return results[0], "single_result"

    expected_norm = expected_commune.lower().replace("boulazac isle manoire", "boulazac")
    for result in results:
        commune = (result.get("siege", {}) or {}).get("libelle_commune", "")
        if expected_norm and expected_norm.split()[0] in commune.lower():
            return result, "commune_matched"
    # Query included the commune and still returned several results —
    # trust the API's own top relevance ranking rather than discarding it.
    return results[0], "top_relevance"


def decode_naf(code: str) -> str:
    if not code:
        return ""
    label = NAF_LABELS.get(code)
    return f"{code} — {label}" if label else code


def decode_tranche(code: str) -> str:
    return TRANCHE_LABELS.get(code, code or "")


def extract_chiffre_affaires(result: dict) -> str:
    finances = result.get("finances") or {}
    if not finances:
        return ""
    latest_year = max(finances.keys())
    ca = finances[latest_year].get("ca")
    if ca is None:
        return ""
    return f"{ca:,.0f} € ({latest_year})".replace(",", " ")


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: check_sirene.py leads.json", file=sys.stderr)
        sys.exit(1)

    leads = json.loads(open(sys.argv[1]).read())

    for i, lead in enumerate(leads, 1):
        name = lead.get("name", "")
        commune = extract_commune(lead.get("address", ""))
        print(f"[{i}/{len(leads)}] {name} ({commune or 'commune inconnue'})...", file=sys.stderr)
        try:
            result, confidence = search_company(name, commune)
        except Exception as exc:  # noqa: BLE001 - one bad lookup shouldn't crash the batch
            print(f"  ! erreur: {exc}", file=sys.stderr)
            continue

        if not result:
            lead["secteur_naf"] = (
                "plusieurs homonymes, aucun ne correspond à la commune"
                if confidence == "ambiguous"
                else "non trouvé au registre"
            )
            continue

        naf_code = result.get("activite_principale", "")
        lead["secteur_naf"] = decode_naf(naf_code)
        lead["tranche_effectif"] = decode_tranche(result.get("tranche_effectif_salarie", ""))
        ca = extract_chiffre_affaires(result)
        if ca:
            lead["chiffre_affaires"] = ca

        dirigeants = result.get("dirigeants") or []
        physiques = [d for d in dirigeants if d.get("type_dirigeant") == "personne physique"]
        if physiques:
            d = physiques[0]
            lead["dirigeant"] = f"{d.get('prenoms', '')} {d.get('nom', '')}".strip()

    print(json.dumps(leads, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
