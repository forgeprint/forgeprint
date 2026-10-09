# Secure storage

An iOS app has one right place for a secret and several convenient wrong ones.
The requirement is OWASP's; the mechanism is the Keychain.

| #   | Check                                                                                                     | How                                                                                                | Source                                                 |
| --- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| SS1 | Tokens, keys and credentials are in the Keychain, not in `UserDefaults` or a file                         | `grep -rnE "UserDefaults                                                                           | \.standard\.set" Sources` and read what each key holds | MASVS-STORAGE-1                                  |
| SS2 | Each Keychain item declares an accessibility class, and a device-bound secret uses a `ThisDeviceOnly` one | `grep -rn "kSecAttrAccessible" Sources`; an item with no accessibility attribute takes the default | MASVS-STORAGE-1; MASVS-STORAGE-2                       |
| SS3 | No API key or secret in `Info.plist`, an `.xcconfig` that ships, or a bundled resource                    | `grep -rniE "api[_-]?key                                                                           | secret                                                 | token" *.plist *.xcconfig Resources`             | MASWE-0004 |
| SS4 | Nothing sensitive is written to the shared container or a group default without the same protection       | read the app-group reads and writes                                                                | MASVS-STORAGE-1                                        |
| SS5 | Backup excludes what is device-bound, and a restored install does not expect it                           | read the file protection attributes and what the first launch assumes                              | MASWE-0006                                             |
| SS6 | No secret in a log, a crash report or an analytics event                                                  | `grep -rnE "print\(                                                                                | os_log                                                 | Logger\(" Sources` and read what is interpolated | MASWE-0001 |
| SS7 | A value that only needs to survive a launch is not persisted at all                                       | read what each stored key is for                                                                   | MASVS-STORAGE-1                                        |

## Why each one

**SS2 is the row most often missing.** A Keychain item with no accessibility
attribute still works, and still ends up in a backup that moves to another
device. The attribute is where "this secret belongs to this phone" is written,
and it is one line.

**SS6 catches what SS1 cannot.** A token stored correctly and then interpolated
into a log is a token in a log. The grep is cheap and the finding is common
after a debugging session.

**SS7 is the cheapest fix on this list.** A secret that is never written cannot
leak, and a surprising number of persisted values exist because persistence was
the first thing to hand.

The depth behind these rows — the MASTG test procedures, and the question of
whether the threat model justifies more — belongs to
[`security-reviewer`](../../security-reviewer/SKILL.md) and
[`appsec-engineer`](../../appsec-engineer/SKILL.md). This checklist is what the
engineer owns before anybody audits it.
