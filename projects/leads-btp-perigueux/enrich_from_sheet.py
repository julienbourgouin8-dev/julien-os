#!/usr/bin/env python3
"""Enrichit les leads déjà dans le Google Sheet (colonnes FR, pas d'adresse
stockée) en réutilisant la logique de recherche du skill lead-gen
(check_sirene.py), avec throttle + retry pour éviter le 429 de l'API
gouvernementale gratuite.

Usage:
    enrich_from_sheet.py sheet_dump.json > enriched.json

sheet_dump.json = sortie brute de `gws sheets +read ... !A1:M1000` (avec
en-tête en première ligne). Ne relance la recherche que pour les lignes où
la colonne E (Tranche effectif) est vide — ne retouche jamais une ligne
déjà renseignée.
"""
import json
import sys
import time
import urllib.error

sys.path.insert(0, ".claude/skills/lead-gen/scripts")
import check_sirene as cs  # noqa: E402

SLEEP_BETWEEN_CALLS = 0.4
MAX_RETRIES = 4

# NAF (Rev.2) sections plausibles pour un lead BTP réel — sert à repérer un
# homonyme (ex. "Christian le Carreleur" matché sur 88.10A, aide à domicile,
# rien à voir). Section F (construction, 41-43) + quelques codes commerce de
# gros/détail de matériaux adjacents documentés dans check_sirene.py.
PLAUSIBLE_NAF_PREFIXES = ("41", "42", "43", "46.73", "46.74", "47.52")


def is_plausible_naf(code: str) -> bool:
    if not code:
        return True  # pas de code renvoyé du tout -> pas un signal d'homonyme
    return code.startswith(PLAUSIBLE_NAF_PREFIXES)


def search_with_retry(name: str):
    delay = 1.5
    for attempt in range(MAX_RETRIES):
        try:
            return cs.search_company(name, "")
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < MAX_RETRIES - 1:
                print(f"  429, retry dans {delay}s...", file=sys.stderr)
                time.sleep(delay)
                delay *= 2
                continue
            raise


def main() -> None:
    dump = json.loads(open(sys.argv[1]).read())
    values = dump.get("values", [])
    header = values[0]
    rows = values[1:]

    out_rows = []
    review_needed = []
    stats = {"filled": 0, "skipped_already_filled": 0, "not_found": 0, "error": 0, "flagged_homonyme": 0}

    for i, row in enumerate(rows, 1):
        row = row + [""] * (13 - len(row))  # pad to 13 cols (A..M)
        name = row[0].strip()
        tranche_existing = row[4].strip()

        if not name:
            out_rows.append(row)
            continue

        if tranche_existing:
            stats["skipped_already_filled"] += 1
            out_rows.append(row)
            continue

        print(f"[{i}/{len(rows)}] {name}...", file=sys.stderr)
        try:
            result, confidence = search_with_retry(name)
        except Exception as exc:  # noqa: BLE001
            print(f"  ! erreur: {exc}", file=sys.stderr)
            stats["error"] += 1
            out_rows.append(row)
            time.sleep(SLEEP_BETWEEN_CALLS)
            continue

        time.sleep(SLEEP_BETWEEN_CALLS)

        if not result:
            stats["not_found"] += 1
            out_rows.append(row)
            continue

        naf_code = result.get("activite_principale", "")
        tranche = cs.decode_tranche(result.get("tranche_effectif_salarie", ""))

        if not is_plausible_naf(naf_code):
            stats["flagged_homonyme"] += 1
            review_needed.append({
                "name": name, "naf_trouve": cs.decode_naf(naf_code),
                "tranche_trouvee": tranche, "confidence": confidence,
            })
            out_rows.append(row)
            continue

        if not tranche:
            stats["not_found"] += 1
            out_rows.append(row)
            continue

        row[4] = tranche
        if not row[10]:
            row[10] = cs.decode_naf(naf_code)
        if not row[11]:
            dirigeants = result.get("dirigeants") or []
            physiques = [d for d in dirigeants if d.get("type_dirigeant") == "personne physique"]
            if physiques:
                d = physiques[0]
                row[11] = f"{d.get('prenoms', '')} {d.get('nom', '')}".strip()
        if not row[12]:
            ca = cs.extract_chiffre_affaires(result)
            if ca:
                row[12] = ca

        stats["filled"] += 1
        out_rows.append(row)

    print(json.dumps(
        {"header": header, "rows": out_rows, "stats": stats, "review_needed": review_needed},
        ensure_ascii=False, indent=2,
    ))
    print(f"STATS: {stats}", file=sys.stderr)


if __name__ == "__main__":
    main()
