#!/bin/bash
set -e

echo "================================================"
echo "Fetching All Documentation"
echo "================================================"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run all fetch scripts
echo "Step 1/3: Fetching Angular Core Documentation..."
"$SCRIPT_DIR/fetch-docs.sh"
echo ""

echo "Step 2/3: Fetching Angular Material Documentation..."
"$SCRIPT_DIR/fetch-material-docs.sh"
echo ""

echo "Step 3/3: Fetching NgRx Documentation..."
"$SCRIPT_DIR/fetch-ngrx-docs.sh"
echo ""

echo "================================================"
echo "✓ All documentation fetched successfully!"
echo "================================================"
echo ""
echo "Documentation structure:"
echo "  docs/"
echo "    ├── v18/          (Angular core)"
echo "    ├── v19/          (Angular core)"
echo "    ├── v20/          (Angular core)"
echo "    ├── v21/          (Angular core)"
echo "    ├── material/"
echo "    │   ├── v18/"
echo "    │   ├── v19/"
echo "    │   ├── v20/"
echo "    │   └── v21/"
echo "    └── ngrx/"
echo "        ├── v18/"
echo "        ├── v19/"
echo "        ├── v20/"
echo "        └── v21/"
echo ""
echo "Next step: Run 'pnpm process-docs' to index the documentation"
