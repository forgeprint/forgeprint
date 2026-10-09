# Observation and state

SwiftUI redraws what reads changed state. Which state, and who owns it, is the
decision that makes a view cheap or expensive, and `@Observable` moved where
that decision is written.

| #   | Check                                                                                                          | How                                                                                          | Source                              |
| --- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| OS1 | Model types the view observes are `@Observable`, not `ObservableObject` with `@Published`                      | `grep -rn "ObservableObject\|@Published" Sources`; each hit has a migration item or a reason | SE-0506                             |
| OS2 | A view holds a reference type it owns with `@State`, and one it is given as a plain `let`                      | read each property wrapper in the view                                                       | SE-0506                             |
| OS3 | No `@ObservedObject` or `@StateObject` beside an `@Observable` type                                            | `grep -rn "@ObservedObject\|@StateObject" Sources`                                           | SE-0506                             |
| OS4 | A view reads the properties it needs, not a whole model passed down to be read at the leaves                   | read the body of each view that takes a model                                                | SE-0506                             |
| OS5 | Work that is not drawing is not in `body`: no I/O, no sorting of a full collection, no date formatting per row | read each `body`; the formatter is built once, not per row                                   | Swift API Design Guidelines         |
| OS6 | A stream of model changes uses the observation API rather than a timer or a manual `objectWillChange`          | `grep -rn "objectWillChange\|Timer.publish" Sources`                                         | SE-0506                             |
| OS7 | One state approach is written down for the app, and the file that says so is in the repository                 | find the document; `grep -rn "@Observable" Sources                                           | wc -l` against the number of models | SE-0506 |

## Why each one

**OS4 is the one that costs frames.** Passing a model down and reading it in a
leaf makes every ancestor that mentions it a dependency of every change. The
fix is boring — read the property at the level that needs it — and it is
invisible until a list scrolls.

**OS1 and OS3 travel together.** A type can be `@Observable` and still be held
by `@StateObject`, in which case the view observes nothing and updates by
accident. The grep finds it; the compiler does not.

**OS7 is the only row here that is not about a line of code.** Two state
approaches in one app is a decision nobody made, and it shows up as two ways to
do the same thing in every feature after it. Writing the choice down is cheap;
discovering it in review for the fourth time is not.
