# Profiling before optimising

The profile says where the time goes. Everything optimised without one is
optimised on a hunch, and hunches about hot paths are wrong often enough that
the profile is always cheaper.

| #   | Check                                                                                     | How                                                                     | Source                        |
| --- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------- |
| PR1 | A profile of the slow path exists before any code is changed for speed                    | find the profile file in `perf/<run>/baseline/`                         | Flame graphs                  |
| PR2 | The profile was taken under the workload from the question, not an idle process           | read the command and the load applied while sampling                    | Systems Performance 2e, ch. 5 |
| PR3 | The change targets a frame that is wide in the profile                                    | name the frame and its share of samples in the report                   | Flame graphs                  |
| PR4 | The kind of time is identified: on-CPU, or waiting (I/O, locks, the network)              | an on-CPU profile that shows little is a hint the time is spent off-CPU | Systems Performance 2e, ch. 5 |
| PR5 | For waiting time, the resource being waited on is named and checked with USE              | tie it back to `server-latency.md` SV4 to SV6                           | USE method                    |
| PR6 | Browser main-thread work is profiled from a trace, not inferred from the Lighthouse score | a performance trace with the long tasks named                           | web.dev — INP                 |
| PR7 | After the change, the same profile is taken again and the frame has shrunk                | compare the two profiles for the named frame                            | Flame graphs                  |

## Why each one

**PR1 is the refusal that saves the most work.** The function everybody
suspects is frequently not where the time is; a flame graph answers the
question in one picture, because the width of a frame is how often it was on
the stack.

**PR4** catches the profile that says nothing. A service that is slow because
it waits on a database or a lock shows a thin on-CPU profile, and optimising
the code in it achieves nothing. The time is off-CPU, and the next step is the
resource it waits for.

**PR7** is the profile-level version of `measurement-discipline.md` MD5: it
shows the change did what it claimed in the place it claimed, not only that a
number moved.
