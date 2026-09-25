# Deep links

A deep link is a request from outside the app. It arrives with parameters the
app did not choose, from a sender it cannot identify when the link uses a
custom scheme.

| #   | Check                                                                                                              | How                                                                                         | Source                                          |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| DL1 | Every route that reads params parses them with a schema before use                                                 | `grep -rn "useLocalSearchParams\|useGlobalSearchParams" app`; each hit feeds a parser       | MASVS-CODE-4; MASWE-0029                        |
| DL2 | A malformed or unknown param falls back to a safe screen; it never throws during render                            | open the link with a bad value: `npx uri-scheme open "<scheme>://<route>?id=%00" --android` | MASVS-CODE-4                                    |
| DL3 | No link performs a state-changing action without an in-app confirmation                                            | read every route reachable by link for calls on mount that write, pay or delete             | MASWE-0029; MASVS-PLATFORM-1                    |
| DL4 | No token, password or one-time code travels in a custom-scheme link                                                | read the `scheme` routes and the server that builds the links                               | RN 0.87 — Security; MASWE-0029                  |
| DL5 | Links to the app's own web domain are verified: Android `intentFilters` with `autoVerify`, iOS `associatedDomains` | read `app.json` / `app.config.*`                                                            | Android App Links; Expo — linking into your app |
| DL6 | The `scheme` is specific to the app, not a generic word another app might also register                            | read `expo.scheme`                                                                          | RN 0.87 — Security                              |
| DL7 | A WebView opened from a link loads only allow-listed origins                                                       | `grep -rn "<WebView" app src`; read `originWhitelist` and the source                        | MASWE-0035; MASVS-PLATFORM-2                    |

## Why each one

**DL3** is the row that separates a navigation bug from an exploit. A link that
opens a "confirm transfer" screen is navigation; a link whose screen transfers
on mount is an action any web page can trigger.

**DL4** because React Native's own security guide says it plainly: nothing
stops another app from registering the same custom scheme and receiving the
link instead. A code in that link is delivered to whoever registered first.

**DL1** because Expo Router hands params over as strings the sender wrote. The
type annotation on `useLocalSearchParams<…>()` is a promise the sender never
made.
