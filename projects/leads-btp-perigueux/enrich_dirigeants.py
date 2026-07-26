#!/usr/bin/env python3
"""Cherche le nom du dirigeant pour chaque lead d'un onglet via l'API
gratuite recherche-entreprises.api.gouv.fr, filtrée sur le département 24
(Dordogne) pour limiter le risque d'homonyme (leçon de l'incident
ETS Lévesque : une recherche par nom seul sans filtre géo peut matcher une
société sans rapport ailleurs en France).

Usage:
    enrich_dirigeants.py leads.json > results.json

leads.json = [{"row": int, "name": str}, ...]
Sortie = [{"row": int, "name": str, "dirigeant": str|null, "confidence": str, "note": str}, ...]
"""
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API_URL = "https://recherche-entreprises.api.gouv.fr/search"
HEADERS = {"User-Agent": "Mozilla/5.0"}
TIMEOUT = 10
SLEEP_BETWEEN_CALLS = 0.4
MAX_RETRIES = 4

# Section F (construction, codes NAF 41-43) + commerce de gros/détail de
# matériaux adjacents documentés dans check_sirene.py — sert à écarter un
# homonyme même à l'intérieur du département 24.
PLAUSIBLE_NAF_PREFIXES = ("41", "42", "43", "46.73", "46.74", "47.52")


def is_plausible_naf(code: str) -> bool:
    if not code:
        return True
    return code.startswith(PLAUSIBLE_NAF_PREFIXES)


def search(name: str, departement: str | None):
    params = {"q": name}
    if departement:
        params["departement"] = departement
    url = f"{API_URL}?{urllib.parse.urlencode(params)}"
    delay = 1.5
    for attempt in range(MAX_RETRIES):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < MAX_RETRIES - 1:
                print(f"  429, retry dans {delay}s...", file=sys.stderr)
                time.sleep(delay)
                delay *= 2
                continue
            raise


def extract_dirigeant(result: dict) -> str:
    dirigeants = result.get("dirigeants") or []
    physiques = [d for d in dirigeants if d.get("type_dirigeant") == "personne physique"]
    if not physiques:
        return ""
    d = physiques[0]
    return f"{d.get('prenoms', '')} {d.get('nom', '')}".strip()


def process_lead(name: str):
    # Filtre departement=24 uniquement : pas de repli national. Un repli
    # sans filtre geo a produit un faux positif en test ("Entreprise Carlos
    # MARTINS" -> matche sur "CARLO DUMERJEAN" a Saint-Martin, NAF plausible
    # par coincidence). Perdre quelques matchs legitimes (siege hors dept 24
    # mais activite dans la zone) est prefere a un dirigeant faux.
    data = search(name, "24")
    results = data.get("results", [])
    confidence = "single_result_dept24" if len(results) == 1 else ("top_relevance_dept24" if results else "none")

    if not results:
        return None, "none", "aucun resultat en departement 24"

    result = results[0]
    naf = result.get("activite_principale", "")

    if not is_plausible_naf(naf):
        return None, "rejected_naf", f"NAF non plausible ({naf}) - probable homonyme"

    if result.get("etat_administratif") != "A":
        return None, "closed", "entreprise fermee au registre"

    dirigeant = extract_dirigeant(result)
    if not dirigeant:
        return None, "no_physical_dirigeant", "pas de dirigeant personne physique (SAS/gerant morale ou donnee absente)"

    return dirigeant, confidence, ""


def main() -> None:
    leads = json.loads(open(sys.argv[1]).read())
    out = []
    stats = {"found": 0, "not_found": 0, "rejected": 0}

    for i, lead in enumerate(leads, 1):
        name = lead["name"]
        print(f"[{i}/{len(leads)}] {name}...", file=sys.stderr)
        try:
            dirigeant, confidence, note = process_lead(name)
        except Exception as exc:  # noqa: BLE001
            print(f"  ! erreur: {exc}", file=sys.stderr)
            dirigeant, confidence, note = None, "error", str(exc)
        time.sleep(SLEEP_BETWEEN_CALLS)

        if dirigeant:
            stats["found"] += 1
        elif confidence.startswith("rejected"):
            stats["rejected"] += 1
        else:
            stats["not_found"] += 1

        out.append({
            "row": lead["row"], "name": name, "dirigeant": dirigeant,
            "confidence": confidence, "note": note,
        })

    print(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"STATS: {stats}", file=sys.stderr)


if __name__ == "__main__":
    main()
