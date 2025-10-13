#!/bin/bash

# ================================================================
# RLS Policy Audit Runner
# ================================================================
# This script runs the RLS policy audit to test security
# ================================================================

set -e

echo "🔒 Starting RLS Policy Audit..."

# Check if Supabase is running
if ! supabase status > /dev/null 2>&1; then
    echo "❌ Supabase is not running. Please start it first:"
    echo "   supabase start"
    exit 1
fi

echo "✅ Supabase is running"

# Get the database URL
DB_URL=$(supabase status | grep "DB URL" | awk '{print $3}')

if [ -z "$DB_URL" ]; then
    echo "❌ Could not get database URL from Supabase status"
    exit 1
fi

echo "📊 Database URL: $DB_URL"

# Run the RLS audit script
echo "🔍 Running RLS policy tests..."
psql "$DB_URL" -f supabase/scripts/audit-rls-policies.sql

echo "✅ RLS Policy Audit completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Review the audit results above"
echo "   2. Fix any failed tests"
echo "   3. Re-run the audit to verify fixes"
echo "   4. Consider adding more comprehensive tests for edge cases"
