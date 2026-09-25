# API surface

For a Kotlin library — a published artifact, or a module other teams build
against — the public API is the architecture other people depend on. Kotlin's
defaults make it easy to publish more than intended and to break it without
noticing.

| #   | Check                                                                                                  | How                                                                                    | Source                                              |
| --- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | --------------------------------------------------- |
| AS1 | Library modules enable explicit API mode (`kotlin { explicitApi() }`), strict, not warning             | `grep -rn "explicitApi" build-logic buildSrc --include=*.kts`                          | Kotlin 2.4 — API guidelines, simplicity             |
| AS2 | The ABI is dumped and checked: KGP `abiValidation` or the binary-compatibility-validator plugin        | the dump files are committed; `./gradlew checkKotlinAbi` or `apiCheck` runs in `check` | Kotlin 2.4 — ABI validation; BCV 0.18.2             |
| AS3 | A change to the ABI dump is a reviewed decision with a version bump that matches it                    | `git log -p -- '*.api' '*.klib.api'`; each change sits beside a CHANGELOG entry        | Kotlin 2.4 — API guidelines, backward compatibility |
| AS4 | No public `data class` in a library's API                                                              | `grep -rn "^public data class\|^data class" src/main/kotlin` in library modules        | Kotlin 2.4 — API guidelines, backward compatibility |
| AS5 | Adding a parameter with a default keeps old binaries working (`@JvmOverloads` or an explicit overload) | read the ABI diff for removed signatures                                               | Kotlin 2.4 — API guidelines, backward compatibility |
| AS6 | Unstable API is behind a `@RequiresOptIn` marker                                                       | `grep -rn "@RequiresOptIn" src/main/kotlin`; read what is marked                       | Kotlin 2.4 — API guidelines, backward compatibility |
| AS7 | `@PublishedApi internal` is used only for inline functions that need it, and counted as public         | `grep -rn "@PublishedApi" src/main/kotlin`                                             | Kotlin 2.4 — visibility modifiers                   |
| AS8 | Deprecation goes `WARNING`, then `ERROR`, then removal, across releases                                | `grep -rn "@Deprecated" src/main/kotlin`; read `level =` and the release notes         | Kotlin 2.4 — API guidelines, backward compatibility |

## Why each one

**AS4** is the Kotlin-specific surprise. A `data class` generates its
constructor, `copy` and `componentN`; adding a property with a default changes
all three signatures, and every compiled consumer breaks at runtime even though
their source still compiles.

**AS2** is what makes AS4, AS5 and AS8 checkable. Without a dump, a binary
break is found by a consumer; with one, it is a diff in the pull request.

**AS1** because Kotlin declarations are public by default and their types can
be inferred. In explicit API mode the compiler refuses both, so every public
declaration is one somebody chose.
