# Skill authoring

Run for any `SKILL.md`, including this one. The format rows are mechanical;
SK4 to SK6 are the ones that decide whether the skill changes anything.

| #   | Check                                                                                                          | How                                                                  | Source                                        |
| --- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------- |
| SK1 | `name` is 1–64 characters of lowercase letters, digits and single hyphens, and matches the folder              | compare the frontmatter with the folder name                         | Agent Skills spec                             |
| SK2 | `description` is at most 1,024 characters and says what the skill does **and when to use it**                  | read it; both halves are there                                       | Agent Skills spec; Anthropic skills BP        |
| SK3 | The body is under 500 lines; detail lives in files referenced directly from `SKILL.md`, one level deep         | count the lines; follow each link once                               | Agent Skills spec; Anthropic skills BP        |
| SK4 | Every instruction names something checkable: a file that must exist, a command that must pass, a field to fill | for each instruction, write down how you would check it was followed | Forgeprint expert-author; Anthropic skills BP |
| SK5 | At least three eval scenarios exist, and a baseline was recorded **without** the skill                         | the scenarios and the baseline result are on disk                    | Anthropic skills BP                           |
| SK6 | The skill beats its baseline on those scenarios, and the result is recorded                                    | compare the two results files                                        | Anthropic skills BP; Anthropic evals 2026     |
| SK7 | Each referenced script says whether it is to be run or read, and its dependencies are stated                   | read each reference to a script                                      | Anthropic skills BP                           |
| SK8 | MCP tools are named with their server, not by the bare tool name                                               | grep the body for tool names                                         | Anthropic skills BP                           |
| SK9 | The skill was run with every model or agent it claims to support                                               | the claim names the runs                                             | Anthropic skills BP                           |

## Why each one

**SK4 is the whole bar.** "Write clean code" is read, agreed with and changes
nothing. "Run `pnpm test` and do not report done until it exits 0" is the same
intention, and an agent can tell whether it did it.

**SK5 and SK6** are the evidence the skill is worth its context. A skill is
loaded into a window shared with everything else; one that does not beat its
own absence is costing tokens for nothing.

**SK9** is the same honesty rule the catalog applies to `agents`: tested, not
supported. Instructions that suit one model may be too terse for a smaller one.
