# Roles and access

Who can connect, from where, how they prove it, and what they can do once in.
Every row is answered by a catalog view or a configuration file.

| #    | Check                                                                                                     | How                                                                                                      | Source                                |
| ---- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| RA1  | The application role owns no object, and is neither superuser nor `CREATEROLE`, `CREATEDB` or `BYPASSRLS` | `\du+`; `pg_class.relowner` never matches it                                                             | PG18 §21.2; ASVS 5.0 V13.2.2          |
| RA2  | Owner, migrator, application and read-only are separate roles; the owner cannot log in                    | list them; `rolcanlogin = false` for the owner                                                           | PG18 §21.3; ASVS 5.0 V13.2.1          |
| RA3  | Grants are per table and per privilege; `ALTER DEFAULT PRIVILEGES` covers tables created later            | `\dp`; `\ddp`                                                                                            | PG18 §5.8                             |
| RA4  | No schema grants `CREATE` to `PUBLIC`                                                                     | `\dn+`; on a cluster upgraded from before 15, check `public` explicitly                                  | PG18 §5.10.6                          |
| RA5  | `pg_hba.conf` has no `trust` and no `md5`; every remote rule is `hostssl` with `scram-sha-256`            | `SELECT * FROM pg_hba_file_rules`                                                                        | PG18 §20.1, §20.5                     |
| RA6  | Clients verify the server: `sslmode=verify-full` with a trusted root certificate                          | read the connection configuration of every client; `pg_stat_ssl` shows `ssl = true` for all              | PG18 §18.9; ASVS 5.0 V12.3.1, V12.3.2 |
| RA7  | No default or shared credentials; each service has its own role                                           | one login role per consuming service                                                                     | ASVS 5.0 V13.2.1, V13.2.3             |
| RA8  | Passwords come from a secret store and rotate on a written schedule                                       | nothing in the repository; the rotation date is recorded                                                 | ASVS 5.0 V13.3.1, V13.3.4             |
| RA9  | Per-role `CONNECTION LIMIT` and timeouts are set, not cluster-wide                                        | `SELECT rolname, rolconnlimit, rolconfig FROM pg_roles`                                                  | PG18 §19.11.1; ASVS 5.0 V13.1.2       |
| RA10 | Where rows belong to tenants, row security is enabled and forced, and tested as the application role      | `relrowsecurity` and `relforcerowsecurity` are true; a cross-tenant read as the app role returns nothing | PG18 §5.9                             |
| RA11 | `SECURITY DEFINER` functions set a fixed `search_path` ending in `pg_temp`                                | read each such function's `proconfig`                                                                    | PG18 `CREATE FUNCTION`; §21.6         |

## Why each one

**RA1** decides the size of every other incident. An application that connects
as the owner can `DROP` and `ALTER` anything it can reach, so one injection
flaw becomes a schema change. An application role that owns nothing turns the
same flaw into a data exposure — bad, and smaller.

**RA6** catches encryption that authenticates nobody. `sslmode=require`
encrypts the connection to whichever server answers; only `verify-full` checks
it is the right one.

**RA10** has a trap in it: a table owner bypasses row security unless it is
forced. Testing the policy as the owner proves nothing, which is why the test
runs as the application role.
