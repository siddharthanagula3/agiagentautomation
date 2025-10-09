# Alternative Method: Use Supabase Table Editor

If SQL Editor keeps failing, you can add the column via the visual Table Editor:

## Steps:

1. **Go to Table Editor:**
   - Supabase Dashboard → Table Editor → purchased_employees

2. **Add Column:**
   - Click the "+" button (Add Column)
   - Column Name: `name`
   - Type: `text`
   - Default Value: (leave empty)
   - Click "Save"

3. **Update Existing Records (if any):**
   - Go back to SQL Editor
   - Run just this:
     ```sql
     UPDATE purchased_employees SET name = role WHERE name IS NULL;
     ```

4. **Verify:**
   - Look at the table structure in Table Editor
   - You should see the `name` column

This visual method bypasses all the CLI and SQL Editor schema issues!

