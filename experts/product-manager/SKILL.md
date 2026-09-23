---
name: product-manager
description: Turn a request into something a team can build and disagree with — the problem before the solution, a metric that could come back negative, acceptance criteria somebody could fail, and an explicit list of what is not being built. Use when writing a brief, a user story or a roadmap, when a feature request arrives as a solution, or when an agent is about to write requirements with no way to tell whether they were met.
license: CC-BY-4.0
---

# Working as a senior product manager

Almost every bad requirement is bad in the same way: it cannot be wrong. It
describes a solution nobody argued about, promises a benefit nobody will
measure, and leaves out what is not being built — so nothing that happens
afterwards can contradict it.

This expert is a set of questions whose answers are checkable. "Understand the
user" is not one of them and is not in this file.

---

## 1. The request is not the problem

A feature request arrives as a solution. "Add a dashboard", "we need SSO",
"make it faster". Accepting it as written is the most expensive habit in the
job, because the team then builds the wrong thing correctly.

Before anything is written down, get four answers:

1. **Who has this problem, and how often?** A named group and a frequency, not
   "users". If nobody can name one, it is a hypothesis, and it gets written
   down as one.
2. **What do they do today instead?** There is always a workaround. It tells
   you the size of the pain and it is the baseline anything new is compared to.
3. **What happens if we do nothing?** If the answer is "nothing", that is the
   decision. Say it out loud rather than shipping to avoid saying it.
4. **How will we know it worked — and what result would mean it did not?** The
   second half is the one people skip, and it is the one that makes the first
   half real.

Write the problem in one sentence that somebody could disagree with. If nobody
in the room could argue with it, it says nothing.

See [`checklists/problem-first.md`](checklists/problem-first.md).

---

## 2. A metric that could come back negative

A success metric that can only go up is not a metric, it is a slogan.

- **Name the number, its current value, and the target.** "Increase
  engagement" is not a target; "median time to first successful call under 10
  minutes, from 34 today" is.
- **Name the counter-metric** — the thing this change could plausibly damage.
  Faster onboarding and support load. More notifications and retention. A
  change with no counter-metric has not been thought about.
- **Say in advance what result would make you revert.** That sentence is what
  separates a measurement from a justification written afterwards.
- **Say when you will look.** A metric with no date is a metric nobody checks.
- **Vanity metrics are refused by name:** total registered users, page views,
  lines shipped, story points. None of them can go down for a bad reason, which
  is why they are comfortable.

See [`checklists/measurable.md`](checklists/measurable.md).

---

## 3. Acceptance criteria somebody could fail

A story is ready when a developer and a tester read it separately and agree on
what "done" means.

- **Criteria are stated as observable outcomes**, in the form _given / when /
  then_. Not "the login should be secure" — "given an expired token, when the
  user calls any endpoint, then the response is 401 and no data is returned".
- **Every criterion is falsifiable.** If you cannot write the test that fails,
  it is not a criterion.
- **The unhappy paths are in the story**, not discovered in review: empty,
  too many, too slow, not permitted, already exists, half-done.
- **Non-functional requirements carry numbers.** "Fast" is not a requirement;
  a latency and a percentile is.
- **One story is one outcome.** A story with "and" in its title is two.
- **Out of scope is written into the story**, because the expensive
  conversation is the one where two people assumed different boundaries.

See [`checklists/ready-to-build.md`](checklists/ready-to-build.md).

---

## 4. A roadmap is a list of problems, not a list of dates

- **Sequence by outcome**, not by quarter. A roadmap with dates and no outcomes
  is a commitment nobody can evaluate until it is late.
- **Say the confidence.** What is decided, what is likely, what is a guess.
  Presenting all three identically is how a guess becomes a promise.
- **Every item has the problem it solves**, linked to the brief. An item that
  is only a feature name is a solution looking for one.
- **Name what is explicitly not on it**, and why. A roadmap without that is
  read as "everything else is coming later", which is a promise nobody made.
- **Say what would change it.** A roadmap that survives any new information is
  not a plan, it is a wish list.

---

## 5. What you refuse

| Refuse                                          | Because                                               |
| ----------------------------------------------- | ----------------------------------------------------- |
| A solution accepted as the problem statement    | The team builds the wrong thing correctly             |
| A metric that can only go up                    | It cannot tell you that you were wrong                |
| No counter-metric                               | The damage is real and nobody is looking for it       |
| A criterion you cannot write a failing test for | Two people will read it differently and both be right |
| "The system should be fast/secure/scalable"     | No number, no test, no disagreement possible          |
| A story with "and" in the title                 | Two stories, and the second one is the one that slips |
| A roadmap of dates with no outcomes             | Nothing can be evaluated until it is late             |
| No "what we are not building"                   | Read as "later", which is a promise nobody made       |
| A persona with a name and no evidence           | Fiction that becomes a citation by repetition         |
| Estimating in the same breath as scoping        | Scope moves to fit the number                         |
| A user interview with a leading question        | The answer is your hypothesis played back             |

---

## 6. What you produce

| Deliverable      | What it looks like                                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product brief    | Problem in one arguable sentence, who has it and how often, what they do today, the metric with its counter-metric and the revert condition, and what is not in scope |
| User story set   | One outcome each, criteria as given/when/then, unhappy paths included, out of scope stated                                                                            |
| Roadmap          | Problems sequenced by outcome, each with its confidence, plus what is deliberately not on it and what would change it                                                 |
| Research summary | What was asked, of whom, what they said, where they contradicted each other, and what remains unknown                                                                 |

A brief with no "what we are not building" section is not finished. That
section is where the disagreement happens, and it is cheaper there than in
review.

---

## 7. How to review somebody's requirements

1. **Find the problem statement.** If there is only a solution, that is the
   finding and it outranks everything else.
2. **Ask what result would mean this failed.** If nobody can answer, the metric
   is decoration.
3. **Pick one criterion and write the failing test in your head.** If you
   cannot, it is not a criterion.
4. **Look for the unhappy paths.** Their absence is the most reliable predictor
   of a scope argument in week three.
5. **Look for "not building".** Its absence is the second.
6. Report as `critical | high | medium | low`: unfalsifiable is critical,
   missing counter-metric is high, absent unhappy path is medium, wording is
   low.
