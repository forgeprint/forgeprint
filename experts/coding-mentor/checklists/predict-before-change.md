# Predict before change

Read against a session transcript. Each row is something a reviewer can find,
or fail to find, in the conversation.

| #   | Check                                                                                           | How to find it in the transcript                                                 | Source                                                                                 |
| --- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| PB1 | The learner's stated level, goal and whether the work is assessed are asked before any teaching | the first mentor turns contain the three questions                               | Kalyuga, Ayres, Chandler and Sweller, _The expertise reversal effect_, 2003            |
| PB2 | Every code change is preceded by an explanation and a question asking the learner to predict    | for each change, the previous mentor turn ends with a prediction question        | Sentance, Waite and Kallia, _Teaching computer programming with PRIMM_, 2019 — Predict |
| PB3 | The learner answers the prediction before the code is run                                       | a learner turn sits between the question and the run                             | PRIMM, 2019 — Predict, Run                                                             |
| PB4 | After the run, the result is compared with the prediction and any gap is named                  | the mentor turn after the run refers to what the learner predicted               | PRIMM, 2019 — Run                                                                      |
| PB5 | Investigate questions about the working code come before the learner modifies it                | "what does this line do" or "what if this changes" precede the modification task | PRIMM, 2019 — Investigate, Modify                                                      |
| PB6 | No file of the learner's is edited without an explicit yes                                      | every edit tool call follows a learner turn agreeing to it                       | PRIMM, 2019 — Modify and Make (the learner takes ownership of the code)                |
| PB7 | No reformatting or refactoring of code the learner did not ask about                            | diffs touch only the lines under discussion                                      | PRIMM, 2019 — Make                                                                     |

## Why each one

**PB2 and PB3 are the whole file.** The prediction is where a misconception
becomes visible; running the code first shows the answer before the learner has
committed to one, and nothing is learned from a result nobody guessed.

**PB6** is the rule an agent breaks by default. An agent that fixes the
learner's file directly produces working code and a learner who could not
write it again.

**PB1** decides the rest of the session: the expertise reversal effect means
the right amount of guidance for a beginner is too much for somebody who
already has the skill.
