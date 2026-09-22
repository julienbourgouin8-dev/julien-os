#!/usr/bin/env bash
# Extrait projects/<PROJECT> du monorepo julien-os vers son repo GitHub
# dédié (git subtree split), et le pousse. Réutilisable pour n'importe quel
# projet déjà extrait — ne crée PAS le repo GitHub lui-même (à faire une
# seule fois, voir SKILL.md étape 1).
#
# Usage:
#   scripts/subtree-deploy.sh <project-dir-name> <github-owner>/<repo-name> <path-to-token-file>
#
# Exemple:
#   scripts/subtree-deploy.sh site-adeline julienbourgouin8-dev/creadeline-site \
#     projects/site-adeline/.secrets/github-token.txt
#
# À lancer depuis la racine de julien-os, APRÈS avoir committé les
# changements du projet dans le monorepo (ce script ne commit rien lui-même
# — il opère uniquement sur l'historique déjà committé).

set -euo pipefail

PROJECT="${1:?Usage: subtree-deploy.sh <project-dir-name> <owner>/<repo> <token-file>}"
REPO="${2:?Usage: subtree-deploy.sh <project-dir-name> <owner>/<repo> <token-file>}"
TOKEN_FILE="${3:?Usage: subtree-deploy.sh <project-dir-name> <owner>/<repo> <token-file>}"

PREFIX="projects/${PROJECT}"
BRANCH="extract-${PROJECT}-$$"

if [ ! -d "$PREFIX" ]; then
  echo "Erreur : $PREFIX introuvable depuis le répertoire courant (lance depuis la racine de julien-os)." >&2
  exit 1
fi

if [ ! -f "$TOKEN_FILE" ]; then
  echo "Erreur : fichier token introuvable ($TOKEN_FILE)." >&2
  exit 1
fi

echo "==> Extraction de l'historique de $PREFIX"
git subtree split -P "$PREFIX" -b "$BRANCH"

TOKEN=$(tr -d '[:space:]' < "$TOKEN_FILE")

echo "==> Push vers https://github.com/${REPO}.git (branche main, force)"
git push "https://${TOKEN}@github.com/${REPO}.git" "${BRANCH}:main" --force 2>&1 | sed "s/${TOKEN}/***/g"

echo "==> Nettoyage de la branche locale temporaire"
git branch -D "$BRANCH"

echo "==> Terminé. Va dans Coolify et clique Deploy sur la ressource concernée."
