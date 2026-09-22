# Setup

Creates an MCP server in C# on the official `ModelContextProtocol` SDK, with
one working tool, tests, and a CI workflow.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Step numbers are shared across option branches, so the branch you did not pick
can leave a gap in the numbering. That is expected; follow the steps in order.

Requires the .NET SDK 10, and Node.js 20 or newer for the protocol smoke test in
the last step.

1. Pin the SDK so every machine builds with the same one: `dotnet new globaljson --sdk-version 10.0.100 --roll-forward latestFeature`
   Verify: `dotnet --version`

2. Create the solution: `dotnet new sln -n Mcp`
   Verify: `dotnet sln list`

<!-- if options.transport == stdio -->

3. Create the server as a console application: `dotnet new console -o src/Mcp.Server -f net10.0`
   Verify: `dotnet build src/Mcp.Server`

<!-- endif -->

<!-- if options.transport == http -->

3. Create the server as a web application: `dotnet new web -o src/Mcp.Server -f net10.0`
   Verify: `dotnet build src/Mcp.Server`

<!-- endif -->

4. Add the project to the solution: `dotnet sln add src/Mcp.Server`
   Verify: `dotnet sln list`

<!-- if options.transport == stdio -->

5. Add the MCP SDK: `dotnet add src/Mcp.Server package ModelContextProtocol --version 2.2.0`
   Verify: `dotnet restore src/Mcp.Server`

6. Add the generic host, which provides the application lifetime the server runs under: `dotnet add src/Mcp.Server package Microsoft.Extensions.Hosting --version 10.0.0`
   Verify: `dotnet build src/Mcp.Server`

<!-- endif -->

<!-- if options.transport == http -->

5. Add the MCP SDK with the ASP.NET Core transport: `dotnet add src/Mcp.Server package ModelContextProtocol.AspNetCore --version 2.2.0`
   Verify: `dotnet build src/Mcp.Server`

<!-- endif -->

7. Create `src/Mcp.Server/Tools/EchoTools.cs` with:

   ```csharp
   using System.ComponentModel;
   using ModelContextProtocol.Server;

   namespace Mcp.Server.Tools;

   // The attributes are the contract. A method without [McpServerTool] compiles
   // fine and is simply not there when a client lists tools.
   [McpServerToolType]
   public static class EchoTools
   {
       [McpServerTool(Name = "echo")]
       [Description("Return the message that was sent, to prove the server is reachable.")]
       public static string Echo([Description("Text to send back.")] string message) =>
           $"echo: {message}";
   }
   ```

   Verify: `dotnet build src/Mcp.Server`

<!-- if options.transport == stdio -->

8. Replace `src/Mcp.Server/Program.cs` with:

   ```csharp
   using Microsoft.Extensions.DependencyInjection;
   using Microsoft.Extensions.Hosting;
   using Microsoft.Extensions.Logging;

   var builder = Host.CreateApplicationBuilder(args);

   // stdout is the protocol channel. Anything written there that is not a
   // JSON-RPC message corrupts the session, so logging goes to stderr.
   builder.Logging.AddConsole(options => options.LogToStandardErrorThreshold = LogLevel.Trace);

   builder.Services
       .AddMcpServer()
       .WithStdioServerTransport()
       .WithToolsFromAssembly();

   await builder.Build().RunAsync();
   ```

   Verify: `dotnet build src/Mcp.Server`

<!-- endif -->

<!-- if options.transport == http -->

8. Replace `src/Mcp.Server/Program.cs` with:

   ```csharp
   var builder = WebApplication.CreateBuilder(args);

   builder.Services
       .AddMcpServer()
       .WithHttpTransport()
       .WithToolsFromAssembly();

   var app = builder.Build();

   // Serves the streamable HTTP transport at the application root.
   app.MapMcp();

   app.Run();
   ```

   Verify: `dotnet build src/Mcp.Server`

<!-- endif -->

9. Create the test project: `dotnet new xunit -o tests/Mcp.Server.Tests -f net10.0`
   Verify: `dotnet build tests/Mcp.Server.Tests`

10. Add the test project to the solution: `dotnet sln add tests/Mcp.Server.Tests`
    Verify: `dotnet sln list`

11. Reference the server from the tests: `dotnet add tests/Mcp.Server.Tests reference src/Mcp.Server`
    Verify: `dotnet build tests/Mcp.Server.Tests`

12. Create `tests/Mcp.Server.Tests/EchoToolsTests.cs` with:

    ```csharp
    using System.ComponentModel;
    using System.Reflection;
    using Mcp.Server.Tools;
    using ModelContextProtocol.Server;

    namespace Mcp.Server.Tests;

    public sealed class EchoToolsTests
    {
        [Fact]
        public void Echo_returns_the_message()
        {
            Assert.Equal("echo: ping", EchoTools.Echo("ping"));
        }

        [Fact]
        public void Echo_is_exposed_to_the_protocol()
        {
            // Losing an attribute compiles fine and silently removes the tool,
            // so the attributes are asserted rather than assumed.
            Assert.NotNull(typeof(EchoTools).GetCustomAttribute<McpServerToolTypeAttribute>());

            var method = typeof(EchoTools).GetMethod(nameof(EchoTools.Echo));
            Assert.NotNull(method);
            Assert.NotNull(method!.GetCustomAttribute<McpServerToolAttribute>());
            Assert.NotNull(method.GetCustomAttribute<DescriptionAttribute>());
        }
    }
    ```

    Verify: `dotnet build tests/Mcp.Server.Tests`

13. Remove the template's placeholder test: `rm tests/Mcp.Server.Tests/UnitTest1.cs`
    Verify: `test ! -f tests/Mcp.Server.Tests/UnitTest1.cs`

14. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: CI

    on:
      push:
        branches: [main]
      pull_request:

    permissions:
      contents: read

    jobs:
      build:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
          - uses: actions/setup-dotnet@a98b56852c35b8e3190ac28c8c2271da59106c68 # v6.0.0
            with:
              global-json-file: global.json
          - run: dotnet restore
          - run: dotnet build --configuration Release --no-restore
          - run: dotnet test --configuration Release --no-build
    ```

    Verify: `test -f .github/workflows/ci.yml`

15. Build the solution: `dotnet build`
    Verify: `dotnet build --configuration Release`

16. Run the tests: `dotnet test`
    Verify: `dotnet test`

17. Create `scripts/probe.mjs`, a protocol-level smoke test that speaks JSON-RPC to the server:

    ```javascript
    // Usage: node scripts/probe.mjs <command> [args...]
    import { spawn } from 'node:child_process';

    const [command, ...args] = process.argv.slice(2);
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'inherit'] });
    const seen = new Map();
    let buffer = '';

    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let index;
      while ((index = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        if (!line) continue;
        const message = JSON.parse(line);
        if (message.id !== undefined) seen.set(message.id, message);
      }
    });

    const send = (message) => child.stdin.write(`${JSON.stringify(message)}\n`);
    const waitFor = (id) =>
      new Promise((resolve, reject) => {
        const started = Date.now();
        const timer = setInterval(() => {
          if (seen.has(id)) {
            clearInterval(timer);
            resolve(seen.get(id));
          } else if (Date.now() - started > 15000) {
            clearInterval(timer);
            reject(new Error(`timed out waiting for response ${id}`));
          }
        }, 50);
      });

    send({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'probe', version: '1.0.0' },
      },
    });
    const initialized = await waitFor(1);
    console.log('initialize ->', initialized.result.serverInfo.name);

    send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    const list = await waitFor(2);
    console.log('tools/list ->', list.result.tools.map((tool) => tool.name).join(', '));

    send({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'echo', arguments: { message: 'ping' } },
    });
    const call = await waitFor(3);
    console.log('tools/call ->', call.result.content[0].text);

    child.stdin.end();
    child.kill();
    ```

    Verify: `test -f scripts/probe.mjs`

<!-- if options.transport == stdio -->

18. Speak MCP to the server and confirm the tool answers: `node scripts/probe.mjs dotnet src/Mcp.Server/bin/Debug/net10.0/Mcp.Server.dll`
    Verify: `node scripts/probe.mjs dotnet src/Mcp.Server/bin/Debug/net10.0/Mcp.Server.dll`

<!-- endif -->

<!-- if options.transport == http -->

18. Start the built server on a port the operating system chooses, and keep its process id. A fixed port can already be taken, and then the check either fails or — worse — answers from somebody else's server: `dotnet src/Mcp.Server/bin/Debug/net10.0/Mcp.Server.dll --urls http://127.0.0.1:0 > server.log 2>&1 & echo $! > server.pid`
    Verify: `test -s server.pid`

19. Read the address it chose out of its own log: `for attempt in $(seq 30); do grep -oE "http://127\.0\.0\.1:[0-9]+" server.log | head -1 > server.url && test -s server.url && break; sleep 1; done`
    Verify: `test -s server.url`

20. Ask it to initialize, and keep the answer: `curl -fsS -o initialize.json -X POST "$(cat server.url)/" -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"probe","version":"1.0.0"}}}'`
    Verify: `grep -q protocolVersion initialize.json`

21. Stop the server: `kill "$(cat server.pid)"`
    Verify: `sleep 2; ! kill -0 "$(cat server.pid)" 2>/dev/null`

<!-- endif -->

## Connect it to an agent

For the `stdio` option, the client launches the process. In Claude Code:

```bash
claude mcp add my-server -- dotnet run --project src/Mcp.Server
```

For the `http` option, the client connects to a URL instead:

```bash
claude mcp add --transport http my-server http://localhost:5199/
```

Other clients take the same two shapes: a command to spawn, or a URL to call.

## After setup

- `EchoTools` exists to prove the wiring. Replace it with real tools; the
  discovery test in `EchoToolsTests` is the pattern for keeping each one
  reachable.
- The server exposes no resources or prompts yet. Both are registered the same
  way as tools, through `WithResourcesFromAssembly` and
  `WithPromptsFromAssembly`.
- `AGENTS.md` describes what makes a good tool boundary. Read it before adding
  the second tool, not after the fifth.
