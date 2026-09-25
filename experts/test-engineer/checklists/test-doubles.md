# Test doubles

Dummy, stub, spy, mock and fake each promise a different thing. A test that
calls a stub a mock, or verifies a call it only needed an answer from, is
asserting on how the unit is built instead of what it returns.

| #   | Check                                                                                                 | How                                                                                                     | Source                                                          |
| --- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| DO1 | Every double is named for its kind                                                                    | read the arrange blocks; a variable called `mock` that is never verified is a stub                      | Fowler, _Test Double_ (Meszaros's vocabulary)                   |
| DO2 | Collaborators that answer queries are stubbed, and the assertion is on the unit's result              | find call verifications; each one should be on a command whose call is the outcome                      | Fowler, _Mocks Aren't Stubs_ (state and behaviour verification) |
| DO3 | A call verification is never the only assertion when the unit returns a value                         | grep for tests whose last statement is a verify and that ignore the return value                        | Fowler, _Mocks Aren't Stubs_                                    |
| DO4 | The subject under test is never doubled: no partial mock, no overridden method of its own             | grep for spying or partial-mock helpers applied to the class named in the test                          | Vocke, _The Practical Test Pyramid_                             |
| DO5 | Private methods are reached through the public interface, not through reflection                      | grep for reflection helpers and visibility overrides in the test tree                                   | Vocke, _The Practical Test Pyramid_                             |
| DO6 | Every fake has a contract test that runs the same cases against the real implementation               | list the fakes; find a shared test class or parameterised suite for each                                | Fowler, _Contract Test_                                         |
| DO7 | Clock, randomness and generated identifiers are injected and replaced in unit tests                   | grep the unit tests for the system clock, unseeded generators and fresh identifiers                     | Fowler, _Eradicating Non-Determinism in Tests_                  |
| DO8 | Collaborators the unit owns are used for real; only slow, external or non-repeatable ones are doubled | for three unit tests, list the doubles and the reason for each                                          | Fowler, _Unit Test_ (solitary and sociable); Vocke              |
| DO9 | Code that talks to the outside is covered by a narrow integration test of that one adapter            | find the adapter; find the test that runs it against the real file system, database or service stand-in | Vocke, _The Practical Test Pyramid_                             |

## Why each one

**DO2 decides whether the suite survives a refactor.** A test that verifies
`repository.find` was called breaks the day the unit caches, even though the
behaviour is identical. A test that stubs the answer and checks the result does
not care how the answer was obtained.

**DO6 keeps fakes honest.** A fake is a second implementation of an interface,
and a second implementation drifts. Without a contract test the unit tests go
on passing against a fake that accepts what production now rejects.

**DO8** is the classicist position Fowler describes, and the default here
because over-isolated tests pin the internal object graph. The exceptions are
named, not assumed: a double for a collaborator the unit owns needs a reason.
