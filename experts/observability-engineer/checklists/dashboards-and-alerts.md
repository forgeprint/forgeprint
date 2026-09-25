# Dashboards and alerts

A dashboard answers the questions in the plan; an alert tells somebody that
users are affected. Both are code, reviewed with the change that affects them,
or they drift from the system they describe.

| #   | Check                                                                                    | How                                                                              | Source                                  |
| --- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------- |
| DA1 | Every dashboard is a file in the repository, provisioned from it                         | the dashboard directory exists; provisioning configuration points at it          | Grafana 13 — provisioning; Perses 0.54  |
| DA2 | Dashboards edited in the UI are exported and committed, or overwritten by provisioning   | provisioning disallows UI edits, or CI diffs the live dashboard against the file | Grafana 13 — provisioning               |
| DA3 | Each service has one overview: RED for its entry points, then USE for its resources      | read the overview; request rate, error ratio and duration percentiles lead       | RED method; USE method                  |
| DA4 | Every panel maps to a question in the observability plan                                 | a panel with no question is removed or the plan is updated                       | SRE Workbook ch. 4 — monitoring         |
| DA5 | Latency panels show percentiles from histograms, never an average alone                  | read the queries; `histogram_quantile` or the backend's equivalent               | Prometheus — histograms and summaries   |
| DA6 | Alerts page on symptoms users see; causes go to dashboards and tickets                   | read the paging rules; CPU, disk and pool saturation are not pages               | SRE Book ch. 6 — symptoms versus causes |
| DA7 | SLO burn-rate alerts are defined with the site reliability engineer, not duplicated here | the rule references the SLO; no second, different threshold for the same SLI     | SRE Workbook ch. 5 — alerting on SLOs   |
| DA8 | Every alert rule has an owner, a severity and a runbook link                             | labels or annotations on each rule                                               | SRE Book ch. 6; SRE Workbook ch. 4      |
| DA9 | A change that renames or removes a metric updates the dashboards and alerts that use it  | grep the dashboard and rule files for the old name in the same pull request      | SRE Workbook ch. 4 — monitoring         |

## Why each one

**DA1 and DA2** because a dashboard built by hand exists in one database, has
no history and no review, and is lost when the instance is rebuilt. As a file,
it is versioned with the code it describes and can be checked for DA9.

**DA6** is the SRE Book's distinction applied to the alert rules this expert
writes. A saturated connection pool is useful to see and useless to be woken
for unless users feel it — and if they do, the error rate or latency alert
already fired.

**DA9** because the most common way a dashboard goes blank is a metric
renamed in one pull request and the dashboard noticed weeks later. Grepping
the dashboard and rule files in the same change makes the rename visible.
