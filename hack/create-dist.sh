#!/bin/bash

# 1. Grab the version from the first argument
VERSION=$1
COMMIT_HASH=$(git rev-parse --short HEAD)

# 2. Check if the version was provided
if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 1.0.0"
    exit 1
fi
# 3. Define the list of target platforms
PLATFORMS=("darwin-amd64" "darwin-arm64" "linux-arm64" "linux-amd64")

# 4. Define the base directory path
TARGET_DIR="dist/dummy/${VERSION}"

# Create the directory (including parents)
mkdir -p "$TARGET_DIR"

echo "Generating scripts for version: $VERSION..."

# 5. Loop through and create each file
for PLATFORM in "${PLATFORMS[@]}"; do
    FILE_NAME="magic-script-${PLATFORM}.sh"
    FULL_PATH="${TARGET_DIR}/${FILE_NAME}"

    # Generate the platform-specific content
    cat << EOF > "$FULL_PATH"
#!/bin/bash
# Metadata
# Version: $VERSION
# Platform: $PLATFORM
# Commit: $COMMIT_HASH

echo "Running magic-script v$VERSION on $PLATFORM"
# Insert your platform-specific logic below
EOF

    # Make the generated script executable
    chmod +x "$FULL_PATH"
    echo "  [+] Created: $FULL_PATH"
done

echo -e "\nSuccessfully generated all scripts in $TARGET_DIR"

echo "new_release_git_sha_short=$COMMIT_HASH" >> "${GITHUB_OUTPUT:-/dev/null}"