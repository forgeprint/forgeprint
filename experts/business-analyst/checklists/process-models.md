# Process models

A process model is a requirement in diagram form, and it is only useful if it
is valid BPMN a tool can open and another analyst can read the same way.

| #   | Check                                                                                   | How                                                  | Source                                           |
| --- | --------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------ |
| PM1 | The model is BPMN 2.0.2 and opens in a BPMN 2.0 tool without errors                     | open the `.bpmn` file; the interchange format is XML | OMG BPMN 2.0.2 (formal/2013-12-09)               |
| PM2 | Each participant is its own pool                                                        | list the pools against the stakeholder list          | BPMN 2.0.2 §9.3 Pool and Participant             |
| PM3 | No sequence flow crosses a pool boundary; lanes may be crossed                          | inspect every flow that touches a pool edge          | BPMN 2.0.2 §9.3                                  |
| PM4 | Message flows connect two separate pools, never two objects in one pool                 | inspect every message flow                           | BPMN 2.0.2 §9.4 Message Flow                     |
| PM5 | Every outgoing flow of an exclusive gateway has a condition except the one default flow | inspect each gateway                                 | BPMN 2.0.2 §8.4.13 Sequence Flow (default flow)  |
| PM6 | Current state and future state are separate diagrams                                    | two files or two diagrams, each named                | BABOK v3, technique 10.35 Process Modelling      |
| PM7 | Decision logic is a rule in the business rules catalogue, referenced from the model     | gateway labels name a rule ID, not the rule's text   | BABOK v3, technique 10.9 Business Rules Analysis |
| PM8 | Every task in the future-state model traces to a requirement ID                         | the trace matrix lists process steps                 | BABOK v3, task 5.1 Trace Requirements            |

## Why each one

**PM3 and PM4 are where hand-offs hide.** A sequence flow drawn across a pool
boundary pretends one participant controls another's work; the specification
requires a message there, and the message is where the integration
requirement is.

**PM6** turns the model into requirements. The difference between the current
and future diagrams is the change; what must happen to get from one to the
other is the transition requirements.

**PM7** keeps rules changeable. A rule written into a gateway label is
invisible to anybody reading the rules catalogue, and it drifts from it.
