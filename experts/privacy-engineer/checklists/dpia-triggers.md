# DPIA triggers

A screening, not a legal opinion. It checks the regulation's and the
regulators' published triggers against the design and records the result for
the person who decides.

| #   | Check                                                                                              | How                                                               | Source                                  |
| --- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------- |
| DP1 | Automated evaluation of personal aspects, with legal or similarly significant effects, is checked  | read the features for scoring, profiling or automated decisions   | GDPR Art. 35(3)(a)                      |
| DP2 | Large-scale processing of special categories or criminal-offence data is checked                   | read the inventory's Category column and the expected volume      | GDPR Art. 35(3)(b)                      |
| DP3 | Large-scale systematic monitoring of a publicly accessible area is checked                         | read the features for cameras, location tracking in public spaces | GDPR Art. 35(3)(c)                      |
| DP4 | Each of the nine WP248 criteria is marked met or not met, with a reason                            | a table in `privacy/dpia-screening.md` with nine rows             | WP29 WP248 rev.01, endorsed by the EDPB |
| DP5 | Two or more criteria met is recorded as "DPIA indicated"; one met is flagged for a decision        | read the result line                                              | WP29 WP248 rev.01                       |
| DP6 | The supervisory authority's Art. 35(4) list for the country concerned is linked and checked        | the screening links the list it read, with the date               | GDPR Art. 35(4)                         |
| DP7 | The screening names who confirmed the result — the DPO or counsel — and when                       | a "Confirmed by" line with a role and a date                      | GDPR Art. 35(2); Art. 39(1)(c)          |
| DP8 | The screening is repeated when the processing changes: a new purpose, category, recipient or scale | a "Re-screen when" section exists                                 | GDPR Art. 35(11)                        |

## Why each one

**DP4** turns "we don't think we need one" into nine written answers. The WP29
guidelines, endorsed by the EDPB, give the criteria; recording each one is what
makes the screening reviewable.

**DP7** is the line this expert does not cross. Article 35(2) has the controller
seek the DPO's advice; the engineering screening is input to that advice, and
the file says whose conclusion it is.

**DP8** because systems drift. A feature that adds scoring or a new processor
can turn a screening that was right into one that is wrong, and Article 35(11)
expects the review.
