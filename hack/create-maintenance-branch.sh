#!/bin/bash

set -e

basename="${0##*/}"
scriptname="${basename%.*}"

PREVIOUS_VERSION=$1
NEXT_VERSION=$2

msg () {
  echo >&2 "[$(date +'%-I:%M:%S %p')] [$scriptname] $*"
}

if [ -z "$PREVIOUS_VERSION" ] || [ -z "$NEXT_VERSION" ]; then
  msg "Error: Missing arguments. Usage: ${basename} <previous_version> <next_version>"
  exit 1
fi

PREV_MAJOR=$(echo "$PREVIOUS_VERSION" | cut -d. -f1)
PREV_MINOR=$(echo "$PREVIOUS_VERSION" | cut -d. -f2)
NEXT_PATCH=$(echo "$NEXT_VERSION" | cut -d. -f3)

VERSION_NAME="v$PREV_MAJOR.$PREV_MINOR"
BRANCH_NAME="release/v$PREV_MAJOR.$PREV_MINOR"

msg "Checking maintenance branch for $VERSION_NAME ..."

# Logic: Only create branch if it's a new Minor or Major (Patch is 0)
if [ "$NEXT_PATCH" -eq 0 ]; then
  msg "Verified: This is a new Minor/Major release."

  msg "Moving $VERSION_NAME to maintenance branch $BRANCH_NAME ..."

  if git ls-remote --heads origin "$BRANCH_NAME" | grep -q "$BRANCH_NAME"; then
    msg "Result: Branch $BRANCH_NAME already exists on origin. Skipping creation."
  else
    msg "Result: Branch $BRANCH_NAME not found. Creating from $PREVIOUS_VERSION ..."

    # Create the branch locally at the tag point and push
    git branch "$BRANCH_NAME" "v$PREVIOUS_VERSION"
    git push origin "$BRANCH_NAME"

    msg "Success: $BRANCH_NAME has been pushed to origin."
  fi
else
  msg "Result: Patch version is $NEXT_PATCH. Skipping maintenance branch creation ..."
fi