# Structured data

Markup describes the page it is on, validates against two tools, and promises
nothing.

| #   | Check                                                                                 | How                                                                                | Source                                                                    |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| SD1 | Structured data is JSON-LD in the served HTML                                         | `curl -s <url> \| grep -c 'application/ld+json'`                                   | Google Search Central — General structured data guidelines                |
| SD2 | Types and properties exist in schema.org                                              | run the page through the Schema Markup Validator; no unknown types or properties   | schema.org 30.1; Schema Markup Validator                                  |
| SD3 | The properties the search feature marks as required are present                       | run the Rich Results Test; no missing required property                            | Google Search Central — General structured data guidelines                |
| SD4 | Everything in the markup is visible on the page                                       | for each marked-up value (price, rating, FAQ answer), find it in the rendered page | Google Search Central — General structured data guidelines                |
| SD5 | Nothing in the markup is misleading or irrelevant to the page                         | read the markup against the page's purpose                                         | Google Search Central — General structured data guidelines; Spam policies |
| SD6 | Markup is generated from the same data as the visible content, not maintained by hand | find where the JSON-LD is built; it reads the same fields the template renders     | Google Search Central — General structured data guidelines                |
| SD7 | The audit does not promise a rich result                                              | grep the audit for "will appear", "guaranteed"                                     | Google Search Central — General structured data guidelines                |

## Why each one

**SD4** is the policy line. Markup that describes content the page does not
show is misleading, and it is the fastest way to lose the rich result the
markup was added for.

**SD6** keeps SD4 true over time. Hand-maintained JSON-LD drifts from the page
the first time a price or an answer changes.

**SD7** because Google states that correct markup does not guarantee a rich
result. An audit that promises one is making a claim the search engine
explicitly does not.
