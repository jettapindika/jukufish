## Setting up connection to supabase

1. Create a ".env.local" file
2. Input the following code
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project_id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

<project_id> can be found in Sidebar -> Project Settings -> General -> Project ID \
<anon_key> can be found in Sidebar -> Project Settings -> API keys -> "Legacy anon, service_role API keys" section -> anon public

## Where user data is stored
User data is stored in "users" and "invite_codes" table.
This can be found in the Sidebar -> Table Editor -> Make schema option public

## Reminder
Invite teammates to the supabase project
