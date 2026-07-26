#!/usr/bin/env python3
"""Batch-enrich a list of leads with phone/email scraped from their website.

Usage:
    enrich_leads.py leads.json > leads_enriched.json

Input JSON: a list of lead objects. Each may already have "phone"/"email"
(e.g. filled from the Google Maps listing) — this script only fills
fields that are still empty, and only for leads that have a "website".
Social-media "websites" (Facebook/Instagram) are skipped — scrape_website
targets a business's own site, not a social profile page.

Prints the enriched list (same shape, same order) to stdout as JSON, and
a one-line progress note per lead to stderr so a long batch is visible
while it runs.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import scrape_website as sw  # noqa: E402

SOCIAL_DOMAINS = ("facebook.com", "instagram.com", "linkedin.com")


def is_social_url(url: str) -> bool:
    return any(domain in url.lower() for domain in SOCIAL_DOMAINS)


def enrich(lead: dict) -> dict:
    website = lead.get("website", "").strip()
    if not website:
        return lead
    if is_social_url(website):
        lead.setdefault("source_email", "")
        if not lead["source_email"]:
            lead["source_email"] = "réseau social (non scrapé)"
        return lead

    result = sw.scrape(website)
    if result.get("error"):
        print(f"  ! {lead.get('name', '?')}: erreur ({result['error']})", file=sys.stderr)

    if not lead.get("email") and result.get("email"):
        lead["email"] = result["email"]
        lead["source_email"] = "site web"
    if not lead.get("phone") and result.get("phone"):
        lead["phone"] = result["phone"]

    lead.setdefault("source_email", "")
    if not lead["source_email"]:
        lead["source_email"] = "aucun"

    return lead


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: enrich_leads.py leads.json", file=sys.stderr)
        sys.exit(1)

    leads = json.loads(Path(sys.argv[1]).read_text())
    enriched = []
    for i, lead in enumerate(leads, 1):
        name = lead.get("name", "?")
        print(f"[{i}/{len(leads)}] {name}...", file=sys.stderr)
        enriched.append(enrich(lead))

    print(json.dumps(enriched, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
