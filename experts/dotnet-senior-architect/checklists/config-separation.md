# Configuration separation

Configuration is read once, at the edge, into a typed object that is validated
before the first request. Everything else is a service locator with a nicer
name.

| #   | Check                                                                  | How                                                        | Source                                         |
| --- | ---------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| C1  | Every options class is bound with `ValidateOnStart()`                  | grep `AddOptions<` and read the chain                      | ASP.NET Core options pattern                   |
| C2  | `IConfiguration` is injected nowhere but the composition root          | grep `IConfiguration`                                      | —                                              |
| C3  | No `IOptions<T>` in Domain                                             | grep the Domain project                                    | The domain takes parameters, not configuration |
| C4  | No secret has a default value                                          | read every options class for initialisers on secret fields | .NET secrets guidance                          |
| C5  | No connection string, key or token in a committed file                 | grep the settings files and the source                     | .NET secrets guidance                          |
| C6  | Environment files are templates; real values come from the environment | the Development settings file holds nothing real           | .NET secrets guidance                          |
| C7  | The app fails to start when a required setting is missing              | remove it and run; startup must fail                       | C1                                             |

## Why each one

**C1 and C7 are the same check from two directions**, and both are needed: the
code can call `ValidateOnStart()` and still pass because the validation
attributes were never added. Only starting the app without the setting proves
the validation exists.

**C4** is the quiet one. A default for a secret means the app runs in a
configuration nobody intended and nothing anywhere says so — the failure is
that it works.
