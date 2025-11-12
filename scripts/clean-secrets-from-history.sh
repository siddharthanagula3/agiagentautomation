#!/bin/bash
# Script to remove secrets from Git history
# WARNING: This rewrites Git history - use with caution!

set -e

echo "⚠️  WARNING: This script will rewrite Git history!"
echo "   All team members will need to re-clone the repository after this."
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

# Secrets to remove
SECRETS=(
    "whsec_0B4ia2Igw7ZAguL7IfEXv96ccElJaWdr"
    "we_1SSTUl0atLU7AWGTUYVLI2id"
)

echo ""
echo "🔍 Checking for secrets in Git history..."

# Check if secrets exist in history
for secret in "${SECRETS[@]}"; do
    if git log --all --full-history -S "$secret" --oneline | grep -q .; then
        echo "   ❌ Found: $secret"
    else
        echo "   ✅ Not found: $secret"
    fi
done

echo ""
echo "🧹 Removing secrets from Git history..."

# Create a file with replacements
cat > /tmp/secrets-replacements.txt << EOF
whsec_0B4ia2Igw7ZAguL7IfEXv96ccElJaWdr==>whsec_<REDACTED>
we_1SSTUl0atLU7AWGTUYVLI2id==>we_<REDACTED>
EOF

# Check if git-filter-repo is available
if command -v git-filter-repo &> /dev/null; then
    echo "   Using git-filter-repo..."
    git filter-repo --replace-text /tmp/secrets-replacements.txt --force
elif command -v bfg &> /dev/null; then
    echo "   Using BFG Repo-Cleaner..."
    bfg --replace-text /tmp/secrets-replacements.txt
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
else
    echo "   ❌ Neither git-filter-repo nor BFG is installed."
    echo "   Install one of them:"
    echo "     - git-filter-repo: pip install git-filter-repo"
    echo "     - BFG: https://rtyley.github.io/bfg-repo-cleaner/"
    exit 1
fi

# Clean up
rm -f /tmp/secrets-replacements.txt

echo ""
echo "✅ Secrets removed from Git history!"
echo ""
echo "📋 Next Steps:"
echo "   1. Verify the changes: git log --all"
echo "   2. Force push to GitHub: git push origin --force --all"
echo "   3. Notify team members to re-clone"
echo "   4. Rotate the exposed secrets in Stripe/Netlify"
echo ""

