# E2E Test Fixes - Todo List

Generated: 2025-10-10T08:42:39.022Z

## Summary

- 🔥 **CRITICAL**: 6 pages
- ⚠️ **HIGH**: 2 pages

---

## CRITICAL Priority (6 items)

### 1. Register

**Route**: `/register`

**Issues**:

- 🐛 **Console Errors**: 25 errors
  - `JSHandle@error`
  - `ErrorBoundary caught an error: JSHandle@error JSHandle@object`
  - `Failed to load resource: the server responded with a status of 404 ()`
- 🌐 **Network Errors**: 9 errors
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`

### 2. Workforce

**Route**: `/workforce`

**Issues**:

- 🐛 **Console Errors**: 23 errors
  - `Failed to load resource: the server responded with a status of 404 ()`
  - `[listPurchasedEmployees] ❌ Error: JSHandle@object`
  - `Failed to load resource: the server responded with a status of 404 ()`
- 🌐 **Network Errors**: 9 errors
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`
- 🔘 **Button Issues**: 3 buttons

### 3. Vibe Coding

**Route**: `/vibe`

**Issues**:

- 🐛 **Console Errors**: 19 errors
  - `Failed to load resource: the server responded with a status of 404 ()`
  - `[listPurchasedEmployees] ❌ Error: JSHandle@object`
  - `Failed to load resource: the server responded with a status of 404 ()`
- 🌐 **Network Errors**: 7 errors
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`
- 🔘 **Button Issues**: 3 buttons

### 4. Chat

**Route**: `/chat`

**Issues**:

- 🐛 **Console Errors**: 15 errors
  - `Failed to load resource: the server responded with a status of 404 ()`
  - `[listPurchasedEmployees] ❌ Error: JSHandle@object`
  - `Failed to load chat data: JSHandle@object`
- 🌐 **Network Errors**: 5 errors
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`
- 🔘 **Button Issues**: 3 buttons

### 5. Settings

**Route**: `/settings`

**Issues**:

- 🐛 **Console Errors**: 5 errors
  - `Error loading data: JSHandle@error`
  - `Failed to load resource: the server responded with a status of 400 ()`
  - `[Billing] ❌ Error fetching user plan: JSHandle@object`
- 🌐 **Network Errors**: 1 errors
  - `400: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/users?select=plan%2Csubscription_end_date%2Cplan_status%2Cstripe_customer_id%2Cstripe_subscription_id%2Cbilling_period&id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23`
- 🔘 **Button Issues**: 3 buttons

### 6. Billing

**Route**: `/billing`

**Issues**:

- 🐛 **Console Errors**: 4 errors
  - `Failed to load resource: the server responded with a status of 400 ()`
  - `[Billing] ❌ Error fetching user plan: JSHandle@object`
  - `[Billing]    This might mean the "plan" column doesn't exist in the users table.`
- 🌐 **Network Errors**: 1 errors
  - `400: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/users?select=plan%2Csubscription_end_date%2Cplan_status%2Cstripe_customer_id%2Cstripe_subscription_id%2Cbilling_period&id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23`
- 🔘 **Button Issues**: 3 buttons


---

## HIGH Priority (2 items)

### 1. Chat Agent

**Route**: `/chat-agent`

**Issues**:

- 🐛 **Console Errors**: 12 errors
  - `Failed to load resource: the server responded with a status of 404 ()`
  - `[listPurchasedEmployees] ❌ Error: JSHandle@object`
  - `Failed to load resource: the server responded with a status of 404 ()`
- 🌐 **Network Errors**: 4 errors
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`
- 🔘 **Button Issues**: 3 buttons

### 2. Multi Chat

**Route**: `/chat-multi`

**Issues**:

- 🐛 **Console Errors**: 8 errors
  - `Failed to load resource: the server responded with a status of 404 ()`
  - `[listPurchasedEmployees] ❌ Error: JSHandle@object`
  - `Error loading data: JSHandle@object`
- 🌐 **Network Errors**: 2 errors
  - `404: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/purchased_employees?select=*&user_id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23&order=purchased_at.desc`
  - `400: https://lywdzvfibhzbljrgovwr.supabase.co/rest/v1/users?select=plan%2Csubscription_end_date%2Cplan_status%2Cstripe_customer_id%2Cstripe_subscription_id%2Cbilling_period&id=eq.195b1d14-f559-49e6-a3c6-1be5588b4a23`
- 🔘 **Button Issues**: 3 buttons


---

