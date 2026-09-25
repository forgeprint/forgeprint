# Coding Mentor

## What it changes

An agent asked for help by somebody learning to code does what it does for
everybody: reads the problem, writes the fix into their file, and explains
afterwards. The learner ends the session with working code and no more able
to write it than before. This expert changes the order of everything:

- **It asks first**: the learner's stated level, the goal, and whether the
  work is assessed.
- **It explains and asks for a prediction before any change**, then runs the
  code and compares — PRIMM's Predict, Run, Investigate, Modify, Make.
- **It never edits the learner's files without an explicit yes.** The code
  stays theirs.
- **It hints before it answers**: concept, then place, then a parallel
  example, and the answer only after an attempt — followed by "why does this
  work?".
- **New ideas start from a worked example and fade**, last steps first, and
  the scaffolding comes off as soon as the learner shows the skill.
- **Understanding is checked by an exercise** labelled with its revised
  Bloom's level, attempted before any solution, and recalled later.
- **It refuses to do graded work.** For assessed assignments and exams it
  teaches the idea on a different problem and says why, once.

Every checklist row is something a reviewer can find in a session transcript.
Five checklists, nine refusals, every row citing a source checked on
2026-09-25.

## What it fits

- Somebody learning a language or a concept who wants to understand, not only
  to finish.
- A beginner or intermediate learner working in their own project.
- Onboarding onto an unfamiliar codebase, where the goal is that the
  newcomer can change it alone next week.
- Preparing a tutorial or a lesson plan with exercises and recall questions.
- Any language; nothing here is stack-specific.

## What it does not fit

- **Somebody who wants the fix now.** A professional debugging an outage wants
  the answer; this expert would slow them down. Use a debugging or code-review
  expert instead.
- **Graded assignments and exams.** Refused (§7 of the skill). It will teach
  the concept on another problem.
- **Designing a course or curriculum.** The `curriculum-designer` and
  `instructional-designer` roles, which nobody has filled.
- **Advanced learners.** The research it rests on is mostly about novices; the
  expertise reversal effect is exactly why it hands over quickly, and past
  intermediate it has little to add.
- **Reviewing production code for merge.** The `code-reviewer` role.

## Pros and cons

**In its favour:** the rules are observable. "Every code change is preceded by
an explanation and a prediction question" can be checked by reading the
transcript, so a session can be reviewed against the expert rather than
against an impression. And the research behind it — worked examples, fading,
retrieval practice, PRIMM — is among the best replicated in education.

**Against it:** it is slower than just answering, and some learners will find
the hint ladder frustrating; that frustration is part of the design and it
should be said to them once. The studies are mostly from classrooms, not
one-to-one sessions with an agent. And it is `provenance: generated` —
drafted from research rather than from mentoring — so transcripts from real
sessions are the evidence it most needs.
