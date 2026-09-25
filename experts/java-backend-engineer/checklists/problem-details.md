# Problem details

Spring Framework has a `ProblemDetail` type and a base advice that produces it.
Spring Boot 4.1.1 leaves the support off. The rows below switch it on and keep
exception handling in one place.

| #   | Check                                                                                            | How                                                                               | Source                                                |
| --- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------- |
| PR1 | `spring.mvc.problemdetails.enabled=true`                                                         | read `application.yaml`; the default is `false`                                   | Spring Boot 4.1 — `spring.mvc.problemdetails.enabled` |
| PR2 | Exactly one `@RestControllerAdvice`, extending `ResponseEntityExceptionHandler`                  | grep `@RestControllerAdvice` and `@ControllerAdvice`                              | Spring Framework 7.0 — Error responses                |
| PR3 | Each domain exception maps to a `ProblemDetail` with a stable `type` URI, a `title` and a status | read the advice; one handler or one `ErrorResponseException` subclass per failure | RFC 9457 §3; Spring Framework 7.0 — Error responses   |
| PR4 | The catch-all handler returns a generic 500 and logs the exception with its stack trace          | throw an unmapped `IllegalStateException` in a test; assert on body and log       | OWASP ASVS 5.0.0 V16; RFC 9457 §5                     |
| PR5 | No `try/catch` in controllers that turns an exception into a `ResponseEntity` by hand            | grep `catch` in `@RestController` classes                                         | Spring Framework 7.0 — Error responses                |
| PR6 | Error Prone `EmptyCatch` and `CatchAndPrintStackTrace` are raised to errors                      | read the Error Prone flags (`-Xep:EmptyCatch:ERROR`)                              | Error Prone 2.50 — bug patterns                       |
| PR7 | A rethrown exception keeps its cause; Error Prone `UnusedException` is enabled                   | read the flags; it is experimental, so it must be turned on by name               | Error Prone 2.50 — UnusedException                    |
| PR8 | `InterruptedException` is never swallowed: the interrupt is restored or the exception propagates | grep `catch (InterruptedException`; enable `InterruptedExceptionSwallowed`        | Error Prone 2.50 — InterruptedExceptionSwallowed      |

## Why each one

**PR1** is a single property with a surprising default. Without it the advice
still handles your own exceptions, but a malformed body or an unsupported media
type falls back to Spring Boot's default error JSON, and clients see two error
formats from one API.

**PR3** is what makes problem details worth having. Clients branch on `type`;
a `type` of `about:blank` on every error gives them a status code and nothing
else to branch on.

**PR7** preserves the one piece of evidence an incident needs. Error Prone
lists it as experimental, which means off until it is named — so name it.
