---
name: efcore-migrations
description: Create, review, apply and undo EF Core migrations in a .NET project. Use when a change touches the DbContext or an entity, when `dotnet ef` reports a pending-model or snapshot error, when a migration must be reverted or renamed, or when deciding how schema changes reach an environment.
license: CC-BY-4.0
---

# EF Core migrations

A migration is code. It is reviewed, committed with the change that needs it,
and it runs against data somebody cares about. Treat it that way.

## The tool

`dotnet ef` is a separate tool from the SDK:

```bash
dotnet tool install --global dotnet-ef --version 10.0.12
dotnet ef --version
```

The project needs `Microsoft.EntityFrameworkCore.Design`, which this blueprint
already adds.

## The loop

1. Change the entity and its configuration in `OnModelCreating`.
2. Create the migration:
   ```bash
   dotnet ef migrations add AddItemArchivedAt --project src/App.Api
   ```
   Name it after what it does, in PascalCase. `Update1` tells a future reader
   nothing.
3. **Read the generated `Up` and `Down` methods before doing anything else.**
   This is the step people skip and regret.
4. Apply it locally:
   ```bash
   dotnet ef database update --project src/App.Api
   ```
5. Commit the migration, the snapshot and the model change together. A
   migration committed without its `ModelSnapshot.cs` breaks the next person's
   `migrations add`.

## Reading the migration before you trust it

Check for these, every time:

- **A column change that drops data.** Narrowing a `string` to
  `HasMaxLength(50)`, or changing a type, can be generated as drop-and-add.
  Look for `DropColumn` followed by `AddColumn` with the same name.
- **A rename that is not a rename.** EF often sees a renamed property as "drop
  the old column, add a new one". Replace it with `migrationBuilder.RenameColumn`
  by hand, or the data goes with the old column.
- **A new non-nullable column on a populated table.** It needs a default, or
  the migration fails on any table with rows. Give it `defaultValue:` or add it
  nullable, backfill, then tighten it in a second migration.
- **An empty migration.** Means the model did not actually change. Delete it
  rather than committing noise.
- **An index you did not ask for.** EF adds indexes for foreign keys. Usually
  right, occasionally expensive on a large table.

## Undoing

Before it is applied anywhere but your machine:

```bash
dotnet ef migrations remove --project src/App.Api
```

That deletes the migration and rewinds the snapshot. If it was already applied
locally, revert the database first:

```bash
dotnet ef database update PreviousMigrationName --project src/App.Api
```

**After it has been applied anywhere shared, never edit or remove it.** Write a
new migration that corrects the state. Editing an applied migration leaves
every environment that already ran it silently different from the code.

## Applying to an environment

Do not call `Database.Migrate()` from application startup. Two instances
starting at once race each other, and a failed migration takes the application
down with it rather than failing a deployment step.

Generate a script and run it as its own deployment step:

```bash
dotnet ef migrations script --idempotent --project src/App.Api --output migrate.sql
```

`--idempotent` makes the script safe to run against a database at any migration
level. Review the SQL for anything that locks a large table.

## Errors and what they mean

| Message                                      | Cause                                                                | Fix                                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `Unable to create a 'DbContext' of type ...` | The design-time tool cannot build the host                           | Run from the solution root and pass `--project`; make sure `Program.cs` still builds |
| `The model for context has pending changes`  | The model changed without a migration                                | `dotnet ef migrations add <Name>`                                                    |
| `Applying migration ... ' failed` mid-run    | Data violates a new constraint                                       | Back out, add a backfill migration first, then the constraint                        |
| `There is already an object named ...`       | A migration was applied but not recorded, often from a manual script | Reconcile `__EFMigrationsHistory`; never re-run by hand blindly                      |
| `No project was found`                       | Wrong working directory                                              | Pass `--project src/App.Api` explicitly                                              |

## Rules for this project

- One migration per pull request unless a backfill genuinely needs two.
- The migration and the model change are in the same commit.
- A migration that drops a column is called out in the pull request
  description, not left for the reviewer to notice.
- Provider-specific SQL stays out of migrations where possible; this project
  supports more than one provider, and raw SQL pins you to the one you wrote it
  against.
