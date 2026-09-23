# Async discipline

Every item here is a documented ASP.NET Core failure mode, not a preference.
The cost of most of them is thread pool starvation, which presents as "the
service got slow" and points at nothing.

| #   | Check                                                                                           | How                                               | Source                                             |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------- |
| A1  | No `.Result`, `.Wait()` or `.GetAwaiter().GetResult()`                                          | grep all three                                    | ASP.NET Core best practices — avoid blocking calls |
| A2  | No `Task.Run` wrapping a synchronous API to make it look async                                  | grep `Task.Run`                                   | ASP.NET Core best practices                        |
| A3  | No `async void` outside an event handler                                                        | grep `async void`                                 | ASP.NET Core best practices                        |
| A4  | The call stack is async end to end, endpoint to database                                        | read one representative path in full              | ASP.NET Core best practices                        |
| A5  | `CancellationToken` reaches the data access call                                                | follow the token from the endpoint signature down | —                                                  |
| A6  | No synchronous read or write of the request or response body                                    | grep the blocking stream and form APIs            | ASP.NET Core best practices                        |
| A7  | `IHttpClientFactory`, never a constructed `HttpClient`                                          | grep for construction                             | ASP.NET Core best practices                        |
| A8  | `HttpContext` is not stored in a field, captured in a background task, or read from two threads | grep the accessor and background work             | ASP.NET Core best practices                        |
| A9  | Collections are paged; no unbounded list on a user-facing endpoint                              | read every list endpoint                          | ASP.NET Core best practices — large collections    |

## Why each one

**A5** is the item that looks done and is not. A `CancellationToken` parameter
on the endpoint that is never passed down means a cancelled request still runs
its query to completion, and under load that is the difference between shedding
work and drowning in it.

**A9** is a denial of service with no attacker: one customer with more data than
the others.
