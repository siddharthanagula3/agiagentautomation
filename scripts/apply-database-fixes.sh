#!/bin/bash
# Apply database fixes for user_settings and vibe_sessions errors
# Created: Nov 18, 2025

set -e  # Exit on error

echo "=================================================="
echo "Applying Database Fixes"
echo "=================================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found"
    echo ""
    echo "Please install it first:"
    echo "  npm install -g supabase"
    echo ""
    echo "Or apply migrations manually via Supabase Dashboard:"
    echo "  1. Go to SQL Editor in your Supabase dashboard"
    echo "  2. Run supabase/migrations/20251118000003_add_handle_new_user_trigger.sql"
    echo "  3. Run supabase/migrations/20251118000004_backfill_existing_users.sql"
    exit 1
fi

echo "✓ Supabase CLI found"
echo ""

# Check if we're in the project root
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Not in project root or Supabase not initialized"
    echo "Run this script from the project root directory"
    exit 1
fi

echo "✓ Found Supabase configuration"
echo ""

# Ask user which environment to apply to
echo "Which environment do you want to apply migrations to?"
echo "  1) Local (localhost)"
echo "  2) Production (requires project link)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "Applying migrations to LOCAL environment..."
    echo ""

    # Check if local Supabase is running
    if ! supabase status &> /dev/null; then
        echo "Local Supabase is not running. Starting now..."
        supabase start
    else
        echo "✓ Local Supabase is running"
    fi

    echo ""
    echo "Applying migration: 20251118000003_add_handle_new_user_trigger.sql"
    supabase migration up --local

    echo ""
    echo "✅ Migrations applied to local environment"
    echo ""
    echo "Verification:"
    echo "  1. New users will automatically get records in public.users"
    echo "  2. Existing users have been backfilled"
    echo "  3. VIBE sessions can now be created"
    echo "  4. User settings page should work without errors"

elif [ "$choice" = "2" ]; then
    echo ""
    echo "Applying migrations to PRODUCTION environment..."
    echo ""

    # Check if linked to production
    if [ ! -f ".supabase/config.toml" ]; then
        echo "❌ Not linked to a production project"
        echo ""
        echo "Link to your project first:"
        echo "  supabase link --project-ref <your-project-ref>"
        exit 1
    fi

    echo "⚠️  WARNING: This will modify your PRODUCTION database"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        echo "Aborted."
        exit 0
    fi

    echo ""
    echo "Pushing migrations to production..."
    supabase db push

    echo ""
    echo "✅ Migrations applied to production"
    echo ""
    echo "Next steps:"
    echo "  1. Verify trigger exists in production"
    echo "  2. Test new user signup"
    echo "  3. Test VIBE session creation"
    echo "  4. Test user settings page"

else
    echo "Invalid choice. Aborted."
    exit 1
fi

echo ""
echo "=================================================="
echo "Database fixes applied successfully!"
echo "=================================================="
echo ""
echo "For more details, see: DATABASE_ERRORS_FIXED.md"
