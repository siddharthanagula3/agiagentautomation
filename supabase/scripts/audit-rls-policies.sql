-- ================================================================
-- RLS Policy Audit Script
-- ================================================================
-- This script tests Row Level Security policies to ensure they
-- prevent unauthorized access and data leakage
-- ================================================================

-- Create test users for RLS testing
DO $$
DECLARE
    test_user_1_id uuid;
    test_user_2_id uuid;
    test_user_3_id uuid;
BEGIN
    -- Create test users (these will be cleaned up after testing)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), 'test_user_1@example.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
        (gen_random_uuid(), 'test_user_2@example.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
        (gen_random_uuid(), 'test_user_3@example.com', crypt('password123', gen_salt('bf')), now(), now(), now())
    RETURNING id INTO test_user_1_id;
    
    -- Get the IDs of the created users
    SELECT id INTO test_user_1_id FROM auth.users WHERE email = 'test_user_1@example.com';
    SELECT id INTO test_user_2_id FROM auth.users WHERE email = 'test_user_2@example.com';
    SELECT id INTO test_user_3_id FROM auth.users WHERE email = 'test_user_3@example.com';
    
    -- Create user profiles for testing
    INSERT INTO public.users (id, email, name, role) VALUES
        (test_user_1_id, 'test_user_1@example.com', 'Test User 1', 'user'),
        (test_user_2_id, 'test_user_2@example.com', 'Test User 2', 'user'),
        (test_user_3_id, 'test_user_3@example.com', 'Test User 3', 'admin');
    
    INSERT INTO public.user_profiles (id, name, bio) VALUES
        (test_user_1_id, 'Test User 1', 'Test bio 1'),
        (test_user_2_id, 'Test User 2', 'Test bio 2'),
        (test_user_3_id, 'Test User 3', 'Test bio 3');
    
    INSERT INTO public.user_settings (id, email_notifications) VALUES
        (test_user_1_id, true),
        (test_user_2_id, false),
        (test_user_3_id, true);
    
    -- Create test data for cross-user access testing
    INSERT INTO public.chat_sessions (id, user_id, title, created_at) VALUES
        (gen_random_uuid(), test_user_1_id, 'User 1 Chat Session', now()),
        (gen_random_uuid(), test_user_2_id, 'User 2 Chat Session', now());
    
    INSERT INTO public.automation_workflows (id, user_id, name, is_template) VALUES
        (gen_random_uuid(), test_user_1_id, 'User 1 Workflow', false),
        (gen_random_uuid(), test_user_2_id, 'User 2 Workflow', false),
        (gen_random_uuid(), test_user_3_id, 'Public Template', true);
    
    INSERT INTO public.purchased_employees (id, user_id, employee_id, employee_name) VALUES
        (gen_random_uuid(), test_user_1_id, 'emp_1', 'AI Assistant 1'),
        (gen_random_uuid(), test_user_2_id, 'emp_2', 'AI Assistant 2');
    
    RAISE NOTICE 'Test users created successfully';
    RAISE NOTICE 'User 1 ID: %', test_user_1_id;
    RAISE NOTICE 'User 2 ID: %', test_user_2_id;
    RAISE NOTICE 'User 3 ID: %', test_user_3_id;
END $$;

-- ================================================================
-- RLS POLICY TESTS
-- ================================================================

-- Test 1: Users table access
DO $$
DECLARE
    test_user_1_id uuid;
    test_user_2_id uuid;
    user_count integer;
BEGIN
    SELECT id INTO test_user_1_id FROM auth.users WHERE email = 'test_user_1@example.com';
    SELECT id INTO test_user_2_id FROM auth.users WHERE email = 'test_user_2@example.com';
    
    -- Test: User 1 should only see their own profile
    SET LOCAL "request.jwt.claims" TO json_build_object('sub', test_user_1_id::text);
    SELECT COUNT(*) INTO user_count FROM public.users;
    
    IF user_count = 1 THEN
        RAISE NOTICE 'PASS: Users table RLS - User 1 can only see their own profile';
    ELSE
        RAISE NOTICE 'FAIL: Users table RLS - User 1 can see % profiles (expected 1)', user_count;
    END IF;
    
    -- Test: User 1 should not be able to see User 2's profile
    SET LOCAL "request.jwt.claims" TO json_build_object('sub', test_user_1_id::text);
    SELECT COUNT(*) INTO user_count FROM public.users WHERE id = test_user_2_id;
    
    IF user_count = 0 THEN
        RAISE NOTICE 'PASS: Users table RLS - User 1 cannot see User 2 profile';
    ELSE
        RAISE NOTICE 'FAIL: Users table RLS - User 1 can see User 2 profile';
    END IF;
END $$;

-- Test 2: User profiles access
DO $$
DECLARE
    test_user_1_id uuid;
    test_user_2_id uuid;
    profile_count integer;
BEGIN
    SELECT id INTO test_user_1_id FROM auth.users WHERE email = 'test_user_1@example.com';
    SELECT id INTO test_user_2_id FROM auth.users WHERE email = 'test_user_2@example.com';
    
    -- Test: User 1 should only see their own profile
    SET LOCAL "request.jwt.claims" TO json_build_object('sub', test_user_1_id::text);
    SELECT COUNT(*) INTO profile_count FROM public.user_profiles;
    
    IF profile_count = 1 THEN
        RAISE NOTICE 'PASS: User profiles RLS - User 1 can only see their own profile';
    ELSE
        RAISE NOTICE 'FAIL: User profiles RLS - User 1 can see % profiles (expected 1)', profile_count;
    END IF;
END $$;

-- Test 3: Chat sessions access
DO $$
DECLARE
    test_user_1_id uuid;
    test_user_2_id uuid;
    session_count integer;
BEGIN
    SELECT id INTO test_user_1_id FROM auth.users WHERE email = 'test_user_1@example.com';
    SELECT id INTO test_user_2_id FROM auth.users WHERE email = 'test_user_2@example.com';
    
    -- Test: User 1 should only see their own chat sessions
    SET LOCAL "request.jwt.claims" TO json_build_object('sub', test_user_1_id::text);
    SELECT COUNT(*) INTO session_count FROM public.chat_sessions;
    
    IF session_count = 1 THEN
        RAISE NOTICE 'PASS: Chat sessions RLS - User 1 can only see their own sessions';
    ELSE
        RAISE NOTICE 'FAIL: Chat sessions RLS - User 1 can see % sessions (expected 1)', session_count;
    END IF;
END $$;

-- Test 4: Automation workflows access
DO $$
DECLARE
    test_user_1_id uuid;
    test_user_2_id uuid;
    workflow_count integer;
BEGIN
    SELECT id INTO test_user_1_id FROM auth.users WHERE email = 'test_user_1@example.com';
    SELECT id INTO test_user_2_id FROM auth.users WHERE email = 'test_user_2@example.com';
    
    -- Test: User 1 should see their own workflows and public templates
    SET LOCAL "request.jwt.claims" TO json_build_object('sub', test_user_1_id::text);
    SELECT COUNT(*) INTO workflow_count FROM public.automation_workflows;
    
    IF workflow_count = 2 THEN
        RAISE NOTICE 'PASS: Automation workflows RLS - User 1 can see their workflows and templates';
    ELSE
        RAISE NOTICE 'FAIL: Automation workflows RLS - User 1 can see % workflows (expected 2)', workflow_count;
    END IF;
END $$;

-- Test 5: Purchased employees access
DO $$
DECLARE
    test_user_1_id uuid;
    test_user_2_id uuid;
    employee_count integer;
BEGIN
    SELECT id INTO test_user_1_id FROM auth.users WHERE email = 'test_user_1@example.com';
    SELECT id INTO test_user_2_id FROM auth.users WHERE email = 'test_user_2@example.com';
    
    -- Test: User 1 should only see their own purchased employees
    SET LOCAL "request.jwt.claims" TO json_build_object('sub', test_user_1_id::text);
    SELECT COUNT(*) INTO employee_count FROM public.purchased_employees;
    
    IF employee_count = 1 THEN
        RAISE NOTICE 'PASS: Purchased employees RLS - User 1 can only see their own employees';
    ELSE
        RAISE NOTICE 'FAIL: Purchased employees RLS - User 1 can see % employees (expected 1)', employee_count;
    END IF;
END $$;

-- Test 6: Public data access (no authentication required)
DO $$
DECLARE
    plan_count integer;
    blog_count integer;
    faq_count integer;
    resource_count integer;
BEGIN
    -- Test: Subscription plans should be publicly readable
    SELECT COUNT(*) INTO plan_count FROM public.subscription_plans WHERE active = true;
    RAISE NOTICE 'Public subscription plans count: %', plan_count;
    
    -- Test: Blog posts should be publicly readable
    SELECT COUNT(*) INTO blog_count FROM public.blog_posts WHERE published = true;
    RAISE NOTICE 'Public blog posts count: %', blog_count;
    
    -- Test: FAQ items should be publicly readable
    SELECT COUNT(*) INTO faq_count FROM public.faq_items WHERE published = true;
    RAISE NOTICE 'Public FAQ items count: %', faq_count;
    
    -- Test: Resources should be publicly readable
    SELECT COUNT(*) INTO resource_count FROM public.resources WHERE published = true;
    RAISE NOTICE 'Public resources count: %', resource_count;
END $$;

-- Test 7: Cross-user data access prevention
DO $$
DECLARE
    test_user_1_id uuid;
    test_user_2_id uuid;
    unauthorized_access boolean := false;
BEGIN
    SELECT id INTO test_user_1_id FROM auth.users WHERE email = 'test_user_1@example.com';
    SELECT id INTO test_user_2_id FROM auth.users WHERE email = 'test_user_2@example.com';
    
    -- Test: User 1 should not be able to update User 2's data
    SET LOCAL "request.jwt.claims" TO json_build_object('sub', test_user_1_id::text);
    
    BEGIN
        UPDATE public.user_profiles SET bio = 'Hacked!' WHERE id = test_user_2_id;
        unauthorized_access := true;
    EXCEPTION WHEN OTHERS THEN
        unauthorized_access := false;
    END;
    
    IF NOT unauthorized_access THEN
        RAISE NOTICE 'PASS: Cross-user update prevention - User 1 cannot update User 2 profile';
    ELSE
        RAISE NOTICE 'FAIL: Cross-user update prevention - User 1 can update User 2 profile';
    END IF;
END $$;

-- ================================================================
-- CLEANUP TEST DATA
-- ================================================================

-- Clean up test users and their data
DO $$
DECLARE
    test_user_1_id uuid;
    test_user_2_id uuid;
    test_user_3_id uuid;
BEGIN
    SELECT id INTO test_user_1_id FROM auth.users WHERE email = 'test_user_1@example.com';
    SELECT id INTO test_user_2_id FROM auth.users WHERE email = 'test_user_2@example.com';
    SELECT id INTO test_user_3_id FROM auth.users WHERE email = 'test_user_3@example.com';
    
    -- Delete test data (cascade will handle related records)
    DELETE FROM auth.users WHERE email IN ('test_user_1@example.com', 'test_user_2@example.com', 'test_user_3@example.com');
    
    RAISE NOTICE 'Test data cleaned up successfully';
END $$;

-- ================================================================
-- RLS POLICY SUMMARY
-- ================================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'ENABLED'
        ELSE 'DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'users', 'user_profiles', 'user_settings', 'user_sessions',
        'user_subscriptions', 'user_credits', 'credit_transactions',
        'purchased_employees', 'chat_sessions', 'chat_messages',
        'token_usage', 'automation_workflows', 'automation_executions',
        'integration_configs', 'webhook_configs', 'support_tickets',
        'notifications', 'user_api_keys', 'audit_logs',
        'subscription_plans', 'blog_posts', 'faq_items', 'resources'
    )
ORDER BY tablename;

-- Show all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
