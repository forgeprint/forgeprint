# Bean validation

In Spring, validation is opt-in per parameter and unknown JSON properties are
dropped by default. Both have to be switched on, in places a reviewer can
point at.

| #   | Check                                                                                                  | How                                                                                          | Source                                                                             |
| --- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| BN1 | Every `@RequestBody` parameter carries `@Valid`                                                        | grep `@RequestBody` lines without `@Valid`                                                   | Spring Framework 7.0 — MVC validation; OWASP ASVS 5.0.0 V2                         |
| BN2 | Controllers that constrain path or query parameters are annotated `@Validated`                         | grep constrained `@PathVariable` / `@RequestParam` in classes without `@Validated`           | Spring Boot 4.1 — Validation                                                       |
| BN3 | `spring.jackson.deserialization.fail-on-unknown-properties=true` is set                                | read `application.yaml`; post a body with an extra field — expect 400                        | jackson-databind 3.1 — DeserializationFeature; Spring Boot 4.1 — JacksonProperties |
| BN4 | Request bodies are `record` types with Jakarta constraints; no `@Entity` is a request or response type | grep controller signatures for entity classes                                                | OWASP API3:2023; Jakarta Validation 3.1                                            |
| BN5 | Every `String`, collection and number in a request record has a bound (`@Size`, `@Max`)                | read each request record                                                                     | Jakarta Validation 3.1; OWASP API4:2023                                            |
| BN6 | Configuration is bound to `@ConfigurationProperties` records annotated `@Validated`                    | grep `@ConfigurationProperties`; remove a required variable — the context must fail to start | Spring Boot 4.1 — Externalized configuration                                       |
| BN7 | No `System.getenv` and no `@Value` for required settings outside the properties records                | grep both                                                                                    | The Twelve-Factor App — III Config                                                 |
| BN8 | Responses from other services are mapped into records and validated before their fields are used       | read each client adapter                                                                     | OWASP ASVS 5.0.0 V2                                                                |
| BN9 | A validation failure returns 400 as problem details naming the fields                                  | post an invalid body; read the response type and body                                        | Spring Boot 4.1 — `spring.mvc.problemdetails.enabled`; RFC 9457 §3                 |

## Why each one

**BN3** is new with Jackson 3. Jackson 2 failed on unknown properties unless
Spring Boot turned that off; Jackson 3 ships with it off, and Spring Boot 4
leaves it off unless `use-jackson2-defaults` is set. Either way a field the
caller should not control is accepted in silence.

**BN4** makes BN3 a second line rather than the only one. If the class Jackson
fills is not the class Hibernate saves, there is no path from a request field
to a column the caller should not reach.

**BN1** is the one agents drop. Constraints on a record without `@Valid` on the
parameter compile, look correct in review, and are never evaluated.
