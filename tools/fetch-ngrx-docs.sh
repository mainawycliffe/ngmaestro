#!/bin/bash
set -e

# Directory setup
DOCS_DIR="$(pwd)/docs"
TEMP_DIR="$(pwd)/tmp/ngrx-repo"

# URLs and Paths
REPO_URL="https://github.com/ngrx/platform.git"
CONTENT_PATH="projects/ngrx.io/content/guide"

# Version mapping (Angular Version:NgRx Version:Branch)
# Based on NgRx compatibility with Angular versions
# NgRx 18.x -> Angular 18
# NgRx 19.x -> Angular 19
# NgRx 20.x -> Angular 20
# NgRx 21.x -> Angular 21 (not released yet, using main)
VERSIONS=(
  "v18:18.1.0"
  "v19:19.0.0"
  "v20:20.0.1"
  "v21:main"
)

# Clean up previous temp
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "Cloning NgRx repository (sparse)..."
git clone --filter=blob:none --no-checkout --depth 1 --sparse "$REPO_URL" "$TEMP_DIR"
cd "$TEMP_DIR"
git sparse-checkout set "$CONTENT_PATH"

for ENTRY in "${VERSIONS[@]}"; do
  VERSION="${ENTRY%%:*}"
  TAG_OR_BRANCH="${ENTRY##*:}"
  TARGET_DIR="$DOCS_DIR/ngrx/$VERSION"
  
  echo "------------------------------------------------"
  echo "Fetching NgRx docs for Angular $VERSION (Tag/Branch: $TAG_OR_BRANCH)..."
  echo "------------------------------------------------"

  # Clear existing docs for this version to avoid stale files
  rm -rf "$TARGET_DIR"
  mkdir -p "$TARGET_DIR"

  # Fetch and checkout specific tag or branch
  if [ "$TAG_OR_BRANCH" = "main" ]; then
    git fetch origin main --depth 1
    git checkout FETCH_HEAD
  else
    # Fetch by tag
    git fetch origin "refs/tags/$TAG_OR_BRANCH" --depth 1 2>/dev/null || {
      # If tag doesn't exist, try as branch
      echo "Tag $TAG_OR_BRANCH not found, trying as branch..."
      git fetch origin "$TAG_OR_BRANCH" --depth 1
    }
    git checkout FETCH_HEAD
  fi

  # Copy content
  if [ -d "$CONTENT_PATH" ]; then
    echo "Copying content to $TARGET_DIR..."
    cp -R "$CONTENT_PATH/"* "$TARGET_DIR/"
    echo "✓ Success for NgRx $VERSION"
  else
    echo "⚠ Content path $CONTENT_PATH not found in $TAG_OR_BRANCH"
  fi
done

# Cleanup
cd ../..
rm -rf "$TEMP_DIR"
echo "------------------------------------------------"
echo "All NgRx documentation fetched successfully!"
