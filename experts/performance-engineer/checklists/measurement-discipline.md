# Measurement discipline

The checklist the other four depend on. A finding from any of them is only as
good as the measurement behind it, and most performance claims fail here rather
than in the engineering.

| #   | Check                                                                                 | How                                                                             | Source                         |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------ |
| MD1 | The question names the journey or endpoint, the metric, the percentile and the target | read `perf/<run>/question.md`                                                   | Systems Performance 2e, ch. 2  |
| MD2 | A baseline exists and was committed before the change                                 | `git log --format='%h %ad %s' -- perf/<run>/baseline` against the change commit | Systems Performance 2e, ch. 2  |
| MD3 | The baseline holds raw tool output, not numbers typed by hand                         | open the files; JSON or tool text, with timestamps                              | Systems Performance 2e, ch. 12 |
| MD4 | The tool, its version, the environment and the exact command are recorded             | read the baseline folder; every one of the four is present                      | Systems Performance 2e, ch. 12 |
| MD5 | Exactly one change sits between baseline and after                                    | `git log <baseline-commit>..<after-commit>` shows one change commit             | Systems Performance 2e, ch. 2  |
| MD6 | Before and after used the same command, environment and number of runs                | diff the recorded commands and environment notes                                | Systems Performance 2e, ch. 12 |
| MD7 | Latency is reported as percentiles, and the percentile is named                       | read the report; an average alone fails                                         | Google SRE Book — SLOs         |
| MD8 | Each side has several runs, summarised as a median with its spread                    | count the raw files; five for Lighthouse, three or more for a load test         | Lighthouse variability         |
| MD9 | A difference inside the run-to-run spread is reported as "no measurable change"       | compare the delta to the baseline's min–max range                               | Lighthouse variability         |

## Why each one

**MD2 is the whole expert in one row.** A baseline recorded after the change is
the new code measured twice, and a baseline that was never recorded is a
memory. The commit order is the cheapest proof there is that the measurement
came first.

**MD5** is what makes the result attributable. Two changes measured together
produce one number and two explanations, and one of the changes may have made
things worse while the other hid it.

**MD9** is the row that stops noise shipping as a win. Lighthouse's own
documentation shows single runs varying enough to swamp a modest improvement;
the same is true of any load test on shared infrastructure.
