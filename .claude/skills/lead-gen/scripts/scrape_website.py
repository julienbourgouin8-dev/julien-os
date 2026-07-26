#!/usr/bin/env python3
"""Scrape a business's own website for a phone number and a contact email.

Usage:
    scrape_website.py "<url>"

Free, no API key: fetches the homepage, follows an obvious "contact" link
if present, and extracts what it can find. Prints JSON:
{"phone": "...", "email": "...", "source_page": "..."}
(fields are "" if nothing usable was found).
"""
import json
import re
import sys
import urllib.request
from urllib.parse import urljoin

TIMEOUT = 8
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    )
}
EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
CONTACT_LINK_RE = re.compile(
    r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>[^<]*(?:contact|nous\s+contacter|nous\s+joindre)[^<]*</a>',
    re.IGNORECASE,
)
# "Mentions légales" (mandatory in France) often lists a publisher email
# distinct from the sales/support contact form.
LEGAL_LINK_RE = re.compile(
    r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>[^<]*mentions?\s*l[ée]gales?[^<]*</a>',
    re.IGNORECASE,
)
# French phone numbers: 0X XX XX XX XX, with optional +33, various separators.
PHONE_RE = re.compile(
    r"(?:\+33\s?|0)[1-9](?:[\s.\-]?\d{2}){4}"
)
BLOCKLIST_DOMAINS = (
    "sentry.io",
    "wixpress.com",
    "example.com",
    "schema.org",
    "w3.org",
    "googleapis.com",
    "gstatic.com",
    "cloudflare.com",
)
BLOCKLIST_PREFIXES = (
    "noreply@", "no-reply@", "donotreply@", "alert@", "noc@", "monitoring@",
    "status@", "abuse@", "bounce@", "mailer-daemon@", "root@", "hostmaster@",
    "security@",
)
IMAGE_EXT_RE = re.compile(r"\.(png|jpe?g|gif|svg|webp)$", re.IGNORECASE)
# Bundled JS libraries sometimes embed version strings like
# "intl-segmenter@11.7.10" that match the email regex by accident — a
# domain that's purely digits/dots (no letters) is never a real one.
VERSION_STRING_RE = re.compile(r"^[\d.]+$")


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        return resp.read().decode(charset, errors="ignore")


def is_valid_email(email: str) -> bool:
    email = email.lower()
    if IMAGE_EXT_RE.search(email):
        return False
    if any(email.startswith(prefix) for prefix in BLOCKLIST_PREFIXES):
        return False
    if any(domain in email for domain in BLOCKLIST_DOMAINS):
        return False
    domain = email.split("@")[-1]
    if VERSION_STRING_RE.match(domain):
        return False
    return True


def deobfuscate(text: str) -> str:
    # Some sites hand-obfuscate their email against scrapers, e.g.
    # "contact(at)domain.fr" or "contact [at] domain.fr" — undo it so the
    # regex below can actually find it, instead of storing the obfuscated
    # text verbatim as if it were a usable address.
    return re.sub(r"\s*[\[(]\s*at\s*[\])]\s*", "@", text, flags=re.IGNORECASE)


def extract_emails(html: str) -> list[str]:
    html = deobfuscate(html)
    mailtos = re.findall(r'mailto:([^"\'?&\s]+)', html, re.IGNORECASE)
    regex_hits = EMAIL_RE.findall(html)
    seen: dict[str, None] = {}
    for email in mailtos + regex_hits:
        email = email.strip().rstrip(".,;")
        if is_valid_email(email):
            seen.setdefault(email, None)
    return list(seen.keys())


def extract_phones(html: str) -> list[str]:
    tel_links = re.findall(r'tel:([+\d][\d\s.\-]{7,})', html, re.IGNORECASE)
    text_hits = PHONE_RE.findall(html)
    seen: dict[str, None] = {}
    for raw in tel_links + text_hits:
        normalized = normalize_phone(raw)
        if normalized:
            seen.setdefault(normalized, None)
    return list(seen.keys())


def normalize_phone(raw: str) -> str:
    digits = re.sub(r"[^\d+]", "", raw)
    if digits.startswith("+33"):
        digits = "0" + digits[3:]
    elif digits.startswith("33") and len(digits) == 11:
        digits = "0" + digits[2:]
    if len(digits) != 10 or not digits.startswith("0"):
        return ""
    return " ".join(digits[i:i + 2] for i in range(0, 10, 2))


# Free personal-email providers French artisans commonly use as their real
# business contact — a domain mismatch here is normal, not a red flag.
COMMON_PERSONAL_DOMAINS = (
    "gmail.com", "orange.fr", "hotmail.fr", "hotmail.com", "outlook.fr",
    "outlook.com", "live.fr", "icloud.com", "laposte.net", "free.fr",
    "wanadoo.fr", "yahoo.fr", "yahoo.com", "sfr.fr", "bbox.fr",
    "numericable.fr", "neuf.fr", "aliceadsl.fr",
)


def pick_best_email(emails: list[str], site_domain: str) -> str:
    if not emails:
        return ""
    for prefix in ("contact@", "info@"):
        for email in emails:
            if email.lower().startswith(prefix):
                return email
    for email in emails:
        if site_domain and site_domain in email.lower():
            return email
    # Large/complex sites (national groups, page builders) often embed one
    # unrelated address picked up by the raw regex — a monitoring alert, a
    # web-agency's own contact, a widget vendor's support line. Rather than
    # blindly returning the first hit (previously caused false positives
    # like "alert@eurovia.com" or a page-builder vendor's own address),
    # only trust it here if it's on a common personal-email provider —
    # otherwise treat it as not found rather than risk a wrong contact.
    for email in emails:
        domain = email.lower().split("@")[-1]
        if domain in COMMON_PERSONAL_DOMAINS:
            return email
    return ""


def find_contact_link(html: str, base_url: str) -> str | None:
    match = CONTACT_LINK_RE.search(html)
    if not match:
        return None
    return urljoin(base_url, match.group(1))


def find_legal_link(html: str, base_url: str) -> str | None:
    match = LEGAL_LINK_RE.search(html)
    if not match:
        return None
    return urljoin(base_url, match.group(1))


# Guessed common paths tried when no matching <a> link is found by regex —
# many footers wrap the anchor text in nested <span>/<img> tags that the
# text-matching regexes above miss entirely. Tried in order, cheapest/most
# common first.
GUESSED_CONTACT_PATHS = ("/contact", "/contact.html", "/contact/", "/nous-contacter", "/contactez-nous")
GUESSED_LEGAL_PATHS = (
    "/mentions-legales", "/mentions-legales/", "/mentions-legales.html",
    "/mentions_legales", "/legal", "/mentions-legale",
)


def scrape(url: str) -> dict:
    """Fetch a business's homepage + contact + mentions-légales pages and
    return {"phone", "email", "source_page"} (fields "" if not found).
    Shared by the CLI entry point and enrich_leads.py so both get the same
    fallback chain — previously enrich_leads.py reimplemented a subset of
    this and silently skipped the mentions-légales fallback.
    """
    result = {"phone": "", "email": "", "source_page": ""}

    try:
        homepage_html = fetch(url)
    except Exception as exc:  # noqa: BLE001 - report and move on, don't crash the batch
        return {**result, "error": str(exc)}

    site_domain = re.sub(r"^https?://(www\.)?", "", url).split("/")[0]
    fetched_urls = {url}
    pages_to_check = [(url, homepage_html)]

    contact_url = find_contact_link(homepage_html, url)
    candidate_contacts = [contact_url] if contact_url else []
    candidate_contacts += [urljoin(url, p) for p in GUESSED_CONTACT_PATHS]
    for candidate in candidate_contacts:
        if not candidate or candidate in fetched_urls:
            continue
        try:
            html = fetch(candidate)
        except Exception:  # noqa: BLE001 - contact page is best-effort
            fetched_urls.add(candidate)
            continue
        fetched_urls.add(candidate)
        pages_to_check.append((candidate, html))
        if extract_emails(html) or extract_phones(html):
            break  # found a live contact page with something useful, stop guessing more

    for page_url, html in pages_to_check:
        if not result["email"]:
            best_email = pick_best_email(extract_emails(html), site_domain)
            if best_email:
                result["email"] = best_email
                result["source_page"] = page_url
        if not result["phone"]:
            phones = extract_phones(html)
            if phones:
                result["phone"] = phones[0]
                result["source_page"] = result["source_page"] or page_url
        if result["email"] and result["phone"]:
            return result

    # Last resort: "Mentions légales" often lists a publisher email even
    # when the sales/support contact form hides its destination address.
    if not result["email"]:
        legal_url = None
        for _, html in pages_to_check:
            legal_url = find_legal_link(html, url)
            if legal_url:
                break
        candidate_legals = [legal_url] if legal_url else []
        candidate_legals += [urljoin(url, p) for p in GUESSED_LEGAL_PATHS]
        for candidate in candidate_legals:
            if not candidate or candidate in fetched_urls:
                continue
            fetched_urls.add(candidate)
            try:
                legal_html = fetch(candidate)
            except Exception:  # noqa: BLE001 - legal page is best-effort
                continue
            best_email = pick_best_email(extract_emails(legal_html), site_domain)
            if best_email:
                result["email"] = best_email
                result["source_page"] = candidate
                break
            if not result["phone"]:
                phones = extract_phones(legal_html)
                if phones:
                    result["phone"] = phones[0]
                    result["source_page"] = result["source_page"] or candidate

    return result


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: scrape_website.py \"<url>\"", file=sys.stderr)
        sys.exit(1)

    print(json.dumps(scrape(sys.argv[1]), ensure_ascii=False))


if __name__ == "__main__":
    main()
