# Evolution

An API is changed for longer than it is written. The question this checklist
answers is whether a caller can learn about a change from the API itself,
before it breaks them.

| #   | Check                                                                                                         | How                                                                             | Source                                   |
| --- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------- |
| EV1 | One versioning scheme is chosen and recorded                                                                  | an ADR names it; `info.version` and the server URLs agree with it               | OAS 3.2.1 — Info Object; ADR practice    |
| EV2 | Every change is classified additive or breaking before it merges, by diffing the old contract against the new | list removed or renamed fields, operations and enum values; new required inputs | OAS 3.2.1                                |
| EV3 | A breaking change ships as a new major version, never in place                                                | the diff from EV2 is empty of breaking items, or the major version moved        | OAS 3.2.1 — Info Object `version`        |
| EV4 | What is being retired is marked `deprecated: true` in the contract first                                      | `grep -n "deprecated: true" openapi.yaml`                                       | OAS 3.2.1 — Operation, Parameter, Schema |
| EV5 | A deprecated resource sends the `Deprecation` response header                                                 | read the response headers declared on each deprecated operation                 | RFC 9745                                 |
| EV6 | When a removal date exists, the `Sunset` header carries it, and it is not earlier than the deprecation        | compare the two declared values                                                 | RFC 8594; RFC 9745                       |
| EV7 | The contract tells clients to ignore unknown response fields                                                  | read `info.description`                                                         | OAS 3.2.1 — Info Object `description`    |

## Why each one

**EV2** is the one that is skipped because it looks like bureaucracy. A new
required request field, a narrowed type or a removed enum value each break
existing callers while looking like an improvement in review. Only a diff of
the two contracts, read line by line, catches all three.

**EV5 and EV6** are what turn a deprecation from an announcement into a signal.
A changelog is read by people; a header is read by the client's own logging on
every call, which is where the team that has to migrate will actually see it.

**EV7** is the rule that makes adding a field additive. A client that rejects
unknown fields turns every new response member into a breaking change, and the
API cannot fix that after the client ships.
