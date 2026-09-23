# Layering

Four projects, and the only reason to have them is that the boundary is
enforced. A folder named `Domain` inside one project is a naming convention;
`Domain.csproj` with an empty reference list is a design.

| #   | Check                                                                        | How                                                               | Source                                    |
| --- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------- |
| L1  | There are four projects: Domain, Application, Infrastructure, Host           | `dotnet sln list`                                                 | .NET application architecture guidance    |
| L2  | Business rules live in Domain, not in the Host                               | grep the Host for branches on domain state                        | ASP.NET Core best practices — testability |
| L3  | A controller or minimal-API lambda delegates and returns; it decides nothing | read every endpoint; more than about ten lines is a smell         | ASP.NET Core best practices               |
| L4  | Application declares the interfaces it needs; Infrastructure implements them | the interface lives in Application, not beside its implementation | Dependency inversion                      |
| L5  | The Host is the only project that registers services                         | grep for `IServiceCollection` outside the Host                    | Composition root                          |
| L6  | An architecture test asserts L1–L5 and runs in CI                            | the test exists and fails when violated                           | A rule nothing enforces is not a rule     |

## Why each one

**L3** is the one agents break first. A lambda that validates, queries, maps and
returns cannot be tested without a host, so it stops being tested, and the rule
it encodes becomes invisible to everything except production.

**L5** matters because registration is where lifetimes are decided, and a
lifetime decided in two places is a captive-dependency bug waiting for load.
