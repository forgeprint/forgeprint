# Build reproducibility

A Java build resolves a dependency tree that nobody wrote down in full. The
architecture includes deciding which version of each library wins, and being
able to rebuild the same bytes from the same commit.

| #    | Check                                                                                   | How                                                                                                                             | Source                                                       |
| ---- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| BR1  | The build tool wrapper is committed, with a checksum for its distribution               | `mvnw` + `.mvn/wrapper/maven-wrapper.properties`, or `gradlew` + `gradle-wrapper.properties`, each with `distributionSha256Sum` | Maven Wrapper 3.3; Gradle 9.8 — wrapper                      |
| BR2  | Every plugin has an explicit version                                                    | Maven Enforcer `requirePluginVersions`                                                                                          | Maven Enforcer 3.6 — built-in rules                          |
| BR3  | Transitive versions converge                                                            | Enforcer `dependencyConvergence`; Gradle `failOnVersionConflict()`                                                              | Maven Enforcer 3.6; Gradle 9.8 — resolution strategy         |
| BR4  | No dependency resolves below a version something else asked for                         | Enforcer `requireUpperBoundDeps`                                                                                                | Maven Enforcer 3.6 — built-in rules                          |
| BR5  | The JDK and build tool versions are enforced                                            | Enforcer `requireJavaVersion` and `requireMavenVersion`; Gradle toolchains                                                      | Maven Enforcer 3.6; Gradle 9.8 — toolchains                  |
| BR6  | No version ranges anywhere                                                              | `grep -nE "<version>\[\|\(" pom.xml`; `+` or ranges in Gradle files                                                             | Maven — reproducible builds guide                            |
| BR7  | Maven: `project.build.outputTimestamp` is set and `artifact:check-buildplan` is clean   | read `<properties>`; run the goal                                                                                               | Maven — reproducible builds guide; maven-artifact-plugin 3.7 |
| BR8  | A rebuild of the same commit produces the same artifact                                 | `mvn clean verify artifact:compare` after an install                                                                            | maven-artifact-plugin 3.7                                    |
| BR9  | Gradle: dependency locking is on and the lock files are committed                       | `dependencyLocking { lockAllConfigurations() }`; `gradle.lockfile` in git                                                       | Gradle 9.8 — dependency locking                              |
| BR10 | The Spring Boot BOM manages Spring versions; no Spring artifact carries its own version | read the dependencies for explicit Spring versions                                                                              | Spring Boot 4.1 — dependency management                      |

## Why each one

**BR3** is where most "works on my machine" Java bugs live. Two libraries
asking for different versions of a third are resolved by a rule — nearest wins
in Maven — that nobody chose, and the loser's code calls a method that is not
there at runtime.

**BR8** is the only row that proves the others worked. A configuration that
should be reproducible and a build that is reproducible differ by exactly one
plugin that writes a timestamp, and only comparing two builds finds it.

**BR10** because overriding one Spring artifact's version outside the BOM gives
a mix the Spring team never tested together, and the failure shows up as a
`NoSuchMethodError` deep in auto-configuration.
