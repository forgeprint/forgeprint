# Changelog

## 1.0.0 — 2026-09-24

First recipe for Terraform MCP Server, pinned at `1.3.0`.

- Drafted from the 2026-09-24 integrations research
  (`docs/research/2026-09-24-integrations.md`). The version was read live on
  2026-09-24: GitHub `releases/latest` is `v1.3.0` (not a pre-release), and
  Docker Hub lists the `1.3.0` image tag the commands run.
- No secret: the commands enable only the `registry` toolset, which reads the
  public Terraform Registry. The research left open whether a token is needed;
  the upstream README and `pkg/toolsets` at `v1.3.0` say it is not, and that
  `registry` is the default toolset.
- The README says what `TFE_TOKEN` and the `terraform` toolset would add,
  including which destructive tools `ENABLE_TF_OPERATIONS` gates.
- Install commands for the agents whose syntax is verified in
  `schema/agents.yaml`. No command is listed for an agent whose syntax nobody
  has confirmed.
