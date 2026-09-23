# Dependency direction

The one rule that cannot be recovered cheaply once broken: references point
inwards, and Domain points nowhere.

| #   | Check                                                        | How                                                                 | Source                |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------- | --------------------- |
| D1  | Domain references no project                                 | `dotnet list src/Domain/Domain.csproj reference` is empty           | Dependency inversion  |
| D2  | Domain references no package outside the BCL                 | `dotnet list src/Domain/Domain.csproj package --include-transitive` | —                     |
| D3  | Nothing references Infrastructure except the Host            | `dotnet list` on each project                                       | —                     |
| D4  | No EF Core namespace in Domain or Application                | grep both projects for `Microsoft.EntityFrameworkCore`              | Persistence ignorance |
| D5  | No ASP.NET Core namespace outside the Host                   | grep for `Microsoft.AspNetCore`                                     | —                     |
| D6  | Domain types are not EF entities by inheritance or attribute | no mapping attributes, no base class from a data package            | —                     |
| D7  | The direction is asserted by a test, not by review           | a reflection test over `GetReferencedAssemblies()`                  | —                     |

## Why each one

**D2** catches what D1 misses. A project reference is visible in the solution
view; a package reference that drags a dependency-injection abstraction into
the domain is not, and it is how "the domain is pure" stops being true without
anybody deciding it.

**D4** is the specific version of D2 that costs the most: once a domain type is
an EF entity, the schema and the model change together for ever, and every
migration becomes a domain decision.
