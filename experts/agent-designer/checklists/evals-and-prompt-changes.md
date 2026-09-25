# Evals and prompt changes

Run before the first prompt is written, and every time one changes. A prompt
here means anything the model reads that you wrote: the system prompt, a tool
description, a skill, a few-shot example.

| #    | Check                                                                                                           | How                                                        | Source                             |
| ---- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------- |
| EV1  | The eval set existed before the change                                                                          | `git log` on the eval directory predates the prompt change | Anthropic evals 2026               |
| EV2  | Tasks come from real failures, 20 to 50 to start                                                                | each task cites the failure it came from                   | Anthropic evals 2026               |
| EV3  | Each task is unambiguous and has a reference solution that passes its own grader                                | run the grader on the reference solution                   | Anthropic evals 2026               |
| EV4  | Graders are code wherever the outcome can be checked by a command; a model grader has a written rubric          | read each grader                                           | Anthropic evals 2026               |
| EV5  | Trials per task are fixed, and the metric — `pass^k` or `pass@k` — is chosen and stated with the reason         | read the configuration                                     | Anthropic evals 2026               |
| EV6  | A baseline file records the model identifier, the date, the trials, the score per task, and the prompt's commit | the file exists and every field is filled                  | Anthropic evals 2026               |
| EV7  | A held-out split exists and was not run during tuning                                                           | the run history shows it once, at the end                  | Anthropic tools 2025               |
| EV8  | The change carries its delta: target tasks up, no regression task down, same model, same trials                 | compare the new results file with the baseline             | Anthropic evals 2026               |
| EV9  | The harness configuration and every results file are committed, and somebody else could rerun them              | rerun one; the numbers are within the stated variance      | promptfoo 0.123.1; Inspect 0.3.268 |
| EV10 | Transcripts of failed trials were read, not only the scores                                                     | the change notes cite at least one transcript              | Anthropic evals 2026               |

## Why each one

**EV1 and EV6 together are the rule this expert exists for.** An eval set
written after the prompt is fitted to the prompt. A baseline recorded after
the change is not a baseline. Either one turns the comparison into a story.

**EV5** is the row people skip and regret. `pass@k` rises towards 100% as trials
grow and `pass^k` falls; they tell opposite stories. A support agent that must
answer correctly every time is measured by `pass^k`, and reporting `pass@k`
for it overstates it.

**EV8** is where a prompt change is actually accepted or refused. A change that
lifts the target tasks and drops a regression task has moved the failure, not
removed it.

**EV10** catches the eval bug: a grader that fails a correct answer, or passes
a wrong one. The score cannot show that; only reading the transcript can.
