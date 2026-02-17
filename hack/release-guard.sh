#!/usr/bin/env bash
set -euo pipefail

basename="${0##*/}"
scriptname="${basename%.*}"

msg () {
  echo >&2 "[$(date +'%-I:%M:%S %p')] [$scriptname] $*"
}

BRANCH="$1"

if [[ -z "$BRANCH" ]]; then
  msg "Usage: $0 <branch-name>"
  exit 1
fi

msg "Current branch: $BRANCH"

# -----------------------------------------
# vM → latest stable release branch
# must match ^v[0-9]+$
# -----------------------------------------
if [[ "$BRANCH" =~ ^v([0-9]+)$ ]]; then
  MAJOR="${BASH_REMATCH[1]}"
  msg "Branch is latest stable release branch v$MAJOR. Allow release."
  echo "skip=false"
  exit 0
fi

# -----------------------------------------
# 3️⃣ release/vM.m → maintenance branch
# -----------------------------------------
if [[ "$BRANCH" =~ ^release/v([0-9]+)\.([0-9]+)$ ]]; then
  MAJOR="${BASH_REMATCH[1]}"
  MINOR="${BASH_REMATCH[2]}"

  msg "Branch is maintenance release/v${MAJOR}.${MINOR}. Allow semantic release."

  git fetch origin "v${MAJOR}"

  LATEST_VERSION=$(git show "origin/v${MAJOR}:VERSION")
  LATEST_MINOR=$(echo "$LATEST_VERSION" | cut -d. -f2)

  if [[ "$MINOR" -eq "$LATEST_MINOR" ]]; then
    msg "Branch is referring to the latest stable release v${MAJOR}.${MINOR}."
    msg "Skipping as the maintenance must be done from v${MAJOR} branch."
    echo "skip=true"
    exit 0
  fi

  echo "skip=false"
  exit 0
fi

# -----------------------------------------
# 4️⃣ Any other branch → skipped
# -----------------------------------------
msg "Branch does not match release policy. Skipping ..."
echo "skip=true"