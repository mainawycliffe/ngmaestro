#!/bin/bash
set -e

# Directory setup
DOCS_DIR="$(pwd)/docs"
TEMP_DIR="$(pwd)/tmp/analogjs-repo"

# URLs and Paths
REPO_URL="https://github.com/analogjs/analog.git"
CONTENT_PATH="apps/docs-app/docs"

# Versions mapping
# AnalogJS "latest" supports Angular 17-21 (with Vite 5-7)
# Main branch is always the latest stable version
VERSIONS=("latest:main")

# Clean up previous temp
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "Cloning AnalogJS repository (sparse)..."
git clone --filter=blob:none --no-checkout --depth 1 --sparse "$REPO_URL" "$TEMP_DIR"
cd "$TEMP_DIR"
git sparse-checkout set "$CONTENT_PATH"

for ENTRY in "${VERSIONS[@]}"; do
  VERSION="${ENTRY%%:*}"
  BRANCH="${ENTRY##*:}"
  TARGET_DIR="$DOCS_DIR/analogjs/$VERSION"
  
  echo "------------------------------------------------"
  echo "Fetching AnalogJS docs for $VERSION (Branch: $BRANCH)..."
  echo "------------------------------------------------"

  # Fetch and checkout specific branch
  git fetch origin "$BRANCH" --depth 1
  git checkout FETCH_HEAD

  # Clear existing docs for this version to avoid stale files
  rm -rf "$TARGET_DIR"
  mkdir -p "$TARGET_DIR"

  # Copy content
  if [ -d "$CONTENT_PATH" ]; then
    echo "Copying content to $TARGET_DIR..."
    cp -R "$CONTENT_PATH/"* "$TARGET_DIR/"
    echo "✓ Success for AnalogJS $VERSION"
  else
    echo "⚠ Content path $CONTENT_PATH not found in $BRANCH"
  fi
done

# Cleanup
cd ../..
rm -rf "$TEMP_DIR"
echo "------------------------------------------------"
echo "All AnalogJS documentation fetched successfully!"
