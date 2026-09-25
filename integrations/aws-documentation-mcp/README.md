# AWS Documentation MCP Server

> **Third-party software.** Forgeprint hosts no code here: this is an
> installation recipe for a project somebody else publishes and maintains.
> The upstream is [awslabs/mcp/tree/main/src/aws-documentation-mcp-server](https://github.com/awslabs/mcp/tree/main/src/aws-documentation-mcp-server),
> pinned at `1.2.1` and verified on 2026-09-24.
> **Review the permissions below before installing.**

## What it does

Puts the current AWS documentation in front of the agent instead of what it remembers of it: `search_documentation` runs AWS's own documentation search, `read_documentation` and `read_sections` fetch a page as Markdown, `search_table` pulls matching rows out of long tables such as service quotas, and `recommend` returns related and newer pages. For agents writing infrastructure code against services whose limits and APIs change faster than a model's training data.

This recipe runs the upstream's PyPI package through `uvx`, so it needs [uv](https://docs.astral.sh/uv/) installed. `FASTMCP_LOG_LEVEL=ERROR` and `AWS_DOCUMENTATION_PARTITION=aws` are the values the upstream's own configuration uses; set the partition to `aws-cn` for the China documentation, which has a different tool set.

**Why the upstream is a folder, not a repository.** `awslabs/mcp` is one repository holding dozens of AWS servers, each published as its own package with its own version. One integration per upstream (rule 9) is meant per server, so `upstream` names this server's folder. The API server in the same repository, which uses AWS credentials and can change resources, is a different upstream and a different risk; it is not this recipe.

## What it can reach

Reads pages on docs.aws.amazon.com and calls AWS's public documentation search and recommendation APIs; it holds no AWS credentials and reaches no account.

## Install

**claude-code**

```bash
claude mcp add-json aws-documentation '{"command":"uvx","args":["awslabs.aws-documentation-mcp-server==1.2.1"],"env":{"FASTMCP_LOG_LEVEL":"ERROR","AWS_DOCUMENTATION_PARTITION":"aws"}}'
```

**codex**

```bash
codex mcp add aws-documentation --env FASTMCP_LOG_LEVEL=ERROR --env AWS_DOCUMENTATION_PARTITION=aws -- uvx awslabs.aws-documentation-mcp-server==1.2.1
```

**gemini-cli**

```bash
gemini mcp add aws-documentation -e FASTMCP_LOG_LEVEL=ERROR -e AWS_DOCUMENTATION_PARTITION=aws uvx awslabs.aws-documentation-mcp-server==1.2.1
```

Only the agents whose command syntax has been verified are listed. An agent
that is missing here is one whose syntax nobody has confirmed — see
`schema/agents.yaml` for how each agent is configured, and add a verified
command in a pull request rather than guessing one.

## Before you install it

**No credentials, and none should be added.** Nothing in this server reads `AWS_PROFILE` or an access key. If a configuration you copy from elsewhere sets one, remove it; this server does not need it.

**The pages it reads are fixed; what it says to AWS is not nothing.** `read_documentation`, `read_sections` and `search_table` refuse any URL outside `docs.aws.amazon.com`, so this is not a general fetch tool. Every request does carry a random session ID, generated when the server starts, and a search also carries a `search_intent` the model writes to describe what the user is trying to do. AWS receives both with the query. There is no flag to turn that off; keep project secrets and customer names out of what you ask it to search for.

**It presents itself as a browser.** The default user agent is a Chrome string, and upstream documents `MCP_USER_AGENT` to change it for proxies that block it.

## Updating

The version above is a pin, not a floor. Read the upstream's release notes
before moving it, and change `upstream_version`, `verified_on` and the install
commands together in one pull request.
