#!/bin/bash
set -e

VERSION=$1
ACTION=${2:-prepare}

if [ -z "$VERSION" ]; then
  echo "Usage: pnpm release <version> [prepare|tag]"
  echo "  prepare - Create release branch and update version (default)"
  echo "  tag     - Tag the current commit on main"
  exit 1
fi

# Validate version format
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must be in format X.Y.Z (e.g., 0.3.0)"
  exit 1
fi

case "$ACTION" in
  prepare)
    # Ensure we're on main and up to date
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ]; then
      echo "Error: Must be on main branch to prepare release"
      exit 1
    fi

    git pull

    # Create release branch
    BRANCH="release/v$VERSION"
    git checkout -b "$BRANCH"

    # Update version in all files
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/^version = \".*\"/version = \"$VERSION\"/" src-tauri/Cargo.toml
      sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json src-tauri/tauri.conf.json
    else
      sed -i "s/^version = \".*\"/version = \"$VERSION\"/" src-tauri/Cargo.toml
      sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json src-tauri/tauri.conf.json
    fi

    # Commit changes
    git add src-tauri/Cargo.toml package.json src-tauri/tauri.conf.json
    git commit -m "chore: bump version to $VERSION"

    echo ""
    echo "✓ Release branch '$BRANCH' created"
    echo ""
    echo "Next steps:"
    echo "  1. Push the branch:  git push -u origin $BRANCH"
    echo "  2. Create a PR to merge into main"
    echo "  3. After merge, run: pnpm release $VERSION tag"
    ;;

  tag)
    # Ensure we're on main
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ]; then
      echo "Error: Must be on main branch to tag release"
      exit 1
    fi

    git pull

    # Create tag
    git tag "v$VERSION"

    echo ""
    echo "✓ Tag v$VERSION created"
    echo ""
    echo "Next step:"
    echo "  Push the tag:  git push origin v$VERSION"
    echo ""
    echo "After push, GitHub Actions will build and create a draft release"
    ;;

  *)
    echo "Error: Unknown action '$ACTION'. Use 'prepare' or 'tag'"
    exit 1
    ;;
esac
