-- Remove legacy schemas that CRA no longer uses.
-- The live app uses only cra_* tables and the custom cra_admin session cookie.
-- Safe for existing deployments: dropping these tables does not touch cra_* data.

drop table if exists admin_sessions;
drop table if exists products;
drop table if exists ingredients;
drop table if exists settings;
drop table if exists categories;

-- Better Auth / Grok identity was retired from the public app.
drop table if exists "verification";
drop table if exists "account";
drop table if exists "session";
drop table if exists "user";
