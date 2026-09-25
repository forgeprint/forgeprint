# Setup

Creates an HTTP service in Go on Gin, with bearer token verification, tests
that prove an unauthenticated request is refused, a shutdown that drains the
requests in flight, a distroless container and CI.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Go 1.27 or newer and Docker.

1. Start the module: `go mod init example.com/service`
   Verify: `test -f go.mod`

2. Set the module's Go floor explicitly. `go mod init` writes whatever toolchain happens to be installed, so without this the module declares the author's version and the pinned builder image no longer satisfies it — on one machine and not another. 1.27 is the oldest Go release still getting security fixes: `go mod edit -go=1.27`
   Verify: `grep -qE "^go 1\.27" go.mod`

3. Add the pinned dependencies: `go get github.com/gin-gonic/gin@v1.12.0 github.com/golang-jwt/jwt/v5@v5.3.1`
   Verify: `grep -q "gin-gonic/gin v1.12.0" go.mod`

4. Create `internal/auth/auth.go` with:

   ```go
   // Package auth is the only place that decides who a caller is.
   //
   // One module reads the Authorization header and one module validates a
   // token. A second definition of "authenticated" anywhere else is how a
   // service ends up with two, and one of them wrong.
   package auth

   import (
   	"errors"
   	"net/http"
   	"strings"

   	"github.com/gin-gonic/gin"
   	"github.com/golang-jwt/jwt/v5"
   )

   type Settings struct {
   	Secret   []byte
   	Audience string
   	Issuer   string
   }

   const claimsKey = "claims"

   // RequireBearer refuses anything it cannot verify.
   //
   // Every option below is load bearing. WithValidMethods stops a token
   // signed the wrong way from being accepted — without it, "alg: none" and
   // algorithm confusion are live. WithAudience stops a token minted for a
   // different service from working here. WithExpirationRequired stops a
   // token with no exp from being valid forever.
   func RequireBearer(settings Settings) gin.HandlerFunc {
   	return func(c *gin.Context) {
   		raw, found := strings.CutPrefix(c.GetHeader("Authorization"), "Bearer ")
   		if !found || raw == "" {
   			// 401, not 403: "who are you", not "you may not".
   			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "a bearer token is required"})
   			return
   		}

   		token, err := jwt.Parse(
   			raw,
   			func(t *jwt.Token) (any, error) {
   				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
   					return nil, errors.New("unexpected signing method")
   				}
   				return settings.Secret, nil
   			},
   			jwt.WithValidMethods([]string{"HS256"}),
   			jwt.WithAudience(settings.Audience),
   			jwt.WithIssuer(settings.Issuer),
   			jwt.WithExpirationRequired(),
   		)
   		if err != nil || !token.Valid {
   			// The reason is deliberately not returned to the caller: which
   			// check failed is useful to an attacker and to nobody else.
   			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "the token was not accepted"})
   			return
   		}

   		claims, _ := token.Claims.(jwt.MapClaims)
   		c.Set(claimsKey, claims)
   		c.Next()
   	}
   }

   func Claims(c *gin.Context) jwt.MapClaims {
   	value, ok := c.Get(claimsKey)
   	if !ok {
   		return nil
   	}
   	claims, _ := value.(jwt.MapClaims)
   	return claims
   }
   ```

   Verify: `test -f internal/auth/auth.go`

5. Create `internal/api/api.go` with:

   ```go
   // Package api builds the router. A constructor rather than a package-level
   // engine, so a test gets a fresh one with its own settings.
   package api

   import (
   	"net/http"

   	"github.com/gin-gonic/gin"

   	"example.com/service/internal/auth"
   )

   func New(settings auth.Settings) *gin.Engine {
   	gin.SetMode(gin.ReleaseMode)
   	router := gin.New()
   	router.Use(gin.Recovery())

   	// Liveness touches nothing: no database, no token. It answers whether
   	// the process is up, which is the only question an orchestrator is
   	// asking, and it must keep answering when a dependency is down.
   	router.GET("/health", func(c *gin.Context) {
   		c.JSON(http.StatusOK, gin.H{"status": "ok"})
   	})

   	// Everything else goes through the group, so a new route is protected by
   	// where it is declared rather than by the author remembering.
   	protected := router.Group("/", auth.RequireBearer(settings))
   	protected.GET("/items", func(c *gin.Context) {
   		claims := auth.Claims(c)
   		c.JSON(http.StatusOK, gin.H{"items": []string{}, "subject": claims["sub"]})
   	})

   	return router
   }
   ```

   Verify: `test -f internal/api/api.go`

6. Create `internal/api/api_test.go` with:

   ```go
   package api

   import (
   	"net/http"
   	"net/http/httptest"
   	"testing"
   	"time"

   	"github.com/golang-jwt/jwt/v5"

   	"example.com/service/internal/auth"
   )

   var settings = auth.Settings{
   	Secret:   []byte("not-a-real-secret-only-for-tests"),
   	Audience: "service-tests",
   	Issuer:   "service-tests",
   }

   func token(t *testing.T, secret []byte) string {
   	t.Helper()

   	claim := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
   		"sub": "user-1",
   		"aud": settings.Audience,
   		"iss": settings.Issuer,
   		"exp": time.Now().Add(time.Hour).Unix(),
   	})
   	signed, err := claim.SignedString(secret)
   	if err != nil {
   		t.Fatalf("signing: %v", err)
   	}

   	return signed
   }

   func do(t *testing.T, path, bearer string) *httptest.ResponseRecorder {
   	t.Helper()

   	request := httptest.NewRequest(http.MethodGet, path, nil)
   	if bearer != "" {
   		request.Header.Set("Authorization", "Bearer "+bearer)
   	}
   	recorder := httptest.NewRecorder()
   	New(settings).ServeHTTP(recorder, request)

   	return recorder
   }

   func TestHealthNeedsNoToken(t *testing.T) {
   	if got := do(t, "/health", "").Code; got != http.StatusOK {
   		t.Fatalf("got %d, want 200", got)
   	}
   }

   func TestProtectedRefusesWithoutAToken(t *testing.T) {
   	if got := do(t, "/items", "").Code; got != http.StatusUnauthorized {
   		t.Fatalf("got %d, want 401", got)
   	}
   }

   func TestProtectedRefusesAForgedToken(t *testing.T) {
   	// The test that fails the day verification is reduced to decoding.
   	forged := token(t, []byte("a-different-secret-entirely-abcdef"))
   	if got := do(t, "/items", forged).Code; got != http.StatusUnauthorized {
   		t.Fatalf("got %d, want 401", got)
   	}
   }

   func TestProtectedAcceptsAValidToken(t *testing.T) {
   	if got := do(t, "/items", token(t, settings.Secret)).Code; got != http.StatusOK {
   		t.Fatalf("got %d, want 200", got)
   	}
   }

   // The group protects a new route by where it is declared, and nothing stops
   // somebody declaring one outside it. Gin exposes the route table, so the
   // convention can be a check rather than a habit: every route that is not on
   // the allow-list has to refuse a request carrying no token.
   func TestEveryRouteOutsideTheAllowListNeedsAToken(t *testing.T) {
   	public := map[string]bool{"GET /health": true}

   	routes := New(settings).Routes()

   	// A loop over an empty list passes without asserting anything, which is
   	// the way this kind of test stops working without ever failing.
   	if len(routes) == 0 {
   		t.Fatal("the route table is empty")
   	}

   	for _, route := range routes {
   		name := route.Method + " " + route.Path
   		if public[name] {
   			continue
   		}

   		request := httptest.NewRequest(route.Method, route.Path, nil)
   		recorder := httptest.NewRecorder()
   		New(settings).ServeHTTP(recorder, request)

   		if recorder.Code != http.StatusUnauthorized {
   			t.Errorf("%s answered %d without a token, want 401", name, recorder.Code)
   		}
   	}
   }
   ```

   Verify: `test -f internal/api/api_test.go`

7. Create `internal/server/server.go` with:

   ```go
   // Package server owns the listener's lifetime: the timeouts a zero value
   // leaves switched off, and a shutdown that lets requests in flight finish.
   package server

   import (
   	"context"
   	"errors"
   	"fmt"
   	"net"
   	"net/http"
   	"time"
   )

   // ShutdownTimeout bounds the drain. It has to be shorter than the time
   // whatever stops the process waits before it kills it — ten seconds for
   // `docker stop`, thirty for a Kubernetes pod — or SIGKILL cuts the drain
   // off and the requests it was protecting are dropped anyway.
   const ShutdownTimeout = 8 * time.Second

   // New wraps the handler in a server with its timeouts set. In net/http a
   // zero timeout means no timeout.
   func New(handler http.Handler) *http.Server {
   	return &http.Server{
   		Handler: handler,
   		// Without this a slow client can hold a connection open indefinitely
   		// while sending headers one byte at a time.
   		ReadHeaderTimeout: 5 * time.Second,
   	}
   }

   // Run serves on listener until ctx is done, then drains. Shutdown closes
   // the listener first, so nothing new is accepted, and then waits up to
   // timeout for the requests already running to finish.
   func Run(ctx context.Context, srv *http.Server, listener net.Listener, timeout time.Duration) error {
   	served := make(chan error, 1)
   	go func() {
   		served <- srv.Serve(listener)
   	}()

   	select {
   	case err := <-served:
   		// Serve stopped before anybody asked it to.
   		return fmt.Errorf("serving: %w", err)
   	case <-ctx.Done():
   	}

   	// ctx is already cancelled, so the deadline cannot be derived from it
   	// as it stands: the drain would get no time at all.
   	drain, cancel := context.WithTimeout(context.WithoutCancel(ctx), timeout)
   	defer cancel()

   	if err := srv.Shutdown(drain); err != nil {
   		// The deadline passed with requests still running. Close cuts them
   		// off, so the process exits on its own terms rather than being killed.
   		return errors.Join(fmt.Errorf("draining: %w", err), srv.Close())
   	}

   	// Serve returns ErrServerClosed the moment Shutdown starts, and that is
   	// the normal way out. errors.Is rather than ==, which stops matching the
   	// day anything wraps the error.
   	if err := <-served; !errors.Is(err, http.ErrServerClosed) {
   		return fmt.Errorf("serving: %w", err)
   	}

   	return nil
   }
   ```

   Verify: `test -f internal/server/server.go`

8. Create `internal/server/server_test.go` with:

   ```go
   package server

   import (
   	"context"
   	"errors"
   	"io"
   	"net"
   	"net/http"
   	"testing"
   	"time"
   )

   // start runs the server on a port the operating system chooses, and returns
   // its URL, the function that stands in for SIGTERM, and what Run returned.
   func start(t *testing.T, handler http.Handler, timeout time.Duration) (string, context.CancelFunc, <-chan error) {
   	t.Helper()

   	listener, err := net.Listen("tcp", "127.0.0.1:0")
   	if err != nil {
   		t.Fatalf("listening: %v", err)
   	}

   	ctx, cancel := context.WithCancel(context.Background())
   	t.Cleanup(cancel)

   	stopped := make(chan error, 1)
   	go func() {
   		stopped <- Run(ctx, New(handler), listener, timeout)
   	}()

   	return "http://" + listener.Addr().String(), cancel, stopped
   }

   // slow holds a request to /slow until release is closed, and answers /fast
   // at once.
   func slow(started chan<- struct{}, release <-chan struct{}) http.Handler {
   	mux := http.NewServeMux()
   	mux.HandleFunc("GET /slow", func(w http.ResponseWriter, _ *http.Request) {
   		started <- struct{}{}
   		<-release
   		_, _ = io.WriteString(w, "finished")
   	})
   	mux.HandleFunc("GET /fast", func(w http.ResponseWriter, _ *http.Request) {
   		w.WriteHeader(http.StatusNoContent)
   	})
   	return mux
   }

   type result struct {
   	status int
   	body   string
   	err    error
   }

   func get(client *http.Client, url string) result {
   	response, err := client.Get(url)
   	if err != nil {
   		return result{err: err}
   	}
   	defer response.Body.Close()

   	body, err := io.ReadAll(response.Body)
   	return result{status: response.StatusCode, body: string(body), err: err}
   }

   func waitFor(t *testing.T, started <-chan struct{}) {
   	t.Helper()

   	select {
   	case <-started:
   	case <-time.After(5 * time.Second):
   		t.Fatal("the slow request never reached the handler")
   	}
   }

   func TestShutdownFinishesTheRequestInFlightAndRefusesNewOnes(t *testing.T) {
   	started := make(chan struct{}, 1)
   	release := make(chan struct{})
   	url, stop, stopped := start(t, slow(started, release), 5*time.Second)

   	inFlight := make(chan result, 1)
   	go func() {
   		inFlight <- get(&http.Client{Timeout: 10 * time.Second}, url+"/slow")
   	}()
   	waitFor(t, started)

   	// What SIGTERM does in main.
   	stop()

   	// Shutdown closes the listener before it waits, so a new connection is
   	// refused while the first request is still running. Keep-alives off, so
   	// every attempt is a new connection rather than a reused idle one.
   	fresh := &http.Client{Timeout: time.Second, Transport: &http.Transport{DisableKeepAlives: true}}
   	deadline := time.Now().Add(5 * time.Second)
   	for get(fresh, url+"/fast").err == nil {
   		if time.Now().After(deadline) {
   			t.Fatal("the server still accepts new requests after shutdown began")
   		}
   		time.Sleep(10 * time.Millisecond)
   	}

   	select {
   	case err := <-stopped:
   		t.Fatalf("Run returned %v while a request was still running", err)
   	default:
   	}

   	close(release)

   	got := <-inFlight
   	if got.err != nil || got.status != http.StatusOK || got.body != "finished" {
   		t.Fatalf("the request in flight got %d %q, %v; want 200 \"finished\"", got.status, got.body, got.err)
   	}

   	select {
   	case err := <-stopped:
   		if err != nil {
   			t.Fatalf("Run returned %v, want nil", err)
   		}
   	case <-time.After(5 * time.Second):
   		t.Fatal("Run did not return after the last request finished")
   	}
   }

   // The drain is bounded. A request that never finishes must not keep the
   // process alive past the deadline, or the orchestrator kills it instead.
   func TestShutdownGivesUpAtItsDeadline(t *testing.T) {
   	started := make(chan struct{}, 1)
   	release := make(chan struct{})
   	t.Cleanup(func() { close(release) })
   	url, stop, stopped := start(t, slow(started, release), 100*time.Millisecond)

   	go get(&http.Client{Timeout: 10 * time.Second}, url+"/slow")
   	waitFor(t, started)

   	stop()

   	select {
   	case err := <-stopped:
   		if !errors.Is(err, context.DeadlineExceeded) {
   			t.Fatalf("Run returned %v, want the drain's deadline", err)
   		}
   	case <-time.After(5 * time.Second):
   		t.Fatal("Run waited past its deadline")
   	}
   }
   ```

   Verify: `test -f internal/server/server_test.go`

9. Create `main.go` with:

   ```go
   package main

   import (
   	"context"
   	"fmt"
   	"log"
   	"net"
   	"os"
   	"os/signal"
   	"syscall"

   	"example.com/service/internal/api"
   	"example.com/service/internal/auth"
   	"example.com/service/internal/server"
   )

   func required(name string) (string, error) {
   	value := os.Getenv(name)
   	if value == "" {
   		return "", fmt.Errorf("%s is required", name)
   	}
   	return value, nil
   }

   func settingsFromEnv() (auth.Settings, error) {
   	secret, err := required("JWT_SECRET")
   	if err != nil {
   		return auth.Settings{}, err
   	}
   	audience, err := required("JWT_AUDIENCE")
   	if err != nil {
   		return auth.Settings{}, err
   	}
   	issuer, err := required("JWT_ISSUER")
   	if err != nil {
   		return auth.Settings{}, err
   	}

   	return auth.Settings{Secret: []byte(secret), Audience: audience, Issuer: issuer}, nil
   }

   func main() {
   	// Read the configuration before anything listens. A missing variable has
   	// to stop the process: checked per request instead, the service answers
   	// 500 to everything while /health still returns 200 and an orchestrator
   	// calls the container ready.
   	settings, err := settingsFromEnv()
   	if err != nil {
   		log.Fatalf("refusing to start: %v", err)
   	}

   	port := os.Getenv("PORT")
   	if port == "" {
   		port = "8080"
   	}

   	// SIGTERM is what `docker stop` and Kubernetes send, and SIGINT is
   	// Ctrl+C. Either one cancels ctx, and server.Run turns that into a drain
   	// rather than dropping the requests in flight.
   	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, os.Interrupt)
   	defer stop()

   	listener, err := net.Listen("tcp", ":"+port)
   	if err != nil {
   		log.Fatalf("refusing to start: %v", err)
   	}

   	log.Printf("listening on %s", listener.Addr())
   	if err := server.Run(ctx, server.New(api.New(settings)), listener, server.ShutdownTimeout); err != nil {
   		log.Fatal(err)
   	}
   	log.Print("stopped")
   }
   ```

   Verify: `test -f main.go`

10. Create `.gitignore` with:

    ```text
    service
    service.exe
    /dist/
    ```

    Verify: `test -f .gitignore`

11. Create `Dockerfile` with:

    ```dockerfile
    # The builder's Go version has to satisfy the `go` directive in go.mod.
    # Step 2 sets that directive to 1.27, the oldest Go release still getting
    # security fixes; gin 1.12 alone would accept 1.25. Step 16 checks the two
    # still agree, because `go get` can raise the floor and the build then
    # fails here instead.
    FROM golang:1.27.1-alpine AS build
    WORKDIR /src
    # Dependencies first, so a source change does not re-download them.
    COPY go.mod go.sum ./
    RUN go mod download
    COPY . .
    # CGO off, so the binary has no libc dependency and can run on a base image
    # with nothing in it. -trimpath keeps build paths out of the binary.
    RUN CGO_ENABLED=0 go build -trimpath -o /out/service .

    # Nothing but the binary: no shell, no package manager, nothing to exploit
    # that is not the program itself. `nonroot` is the tag, not an instruction.
    # The binary is the entrypoint in exec form, so it is PID 1 and receives
    # the SIGTERM from `docker stop` itself; no shell sits in between to
    # swallow it.
    FROM gcr.io/distroless/static-debian12:nonroot
    COPY --from=build /out/service /service
    USER nonroot:nonroot
    EXPOSE 8080
    ENTRYPOINT ["/service"]
    ```

    Verify: `test -f Dockerfile`

12. Create `.dockerignore` with:

    ```text
    .git
    *_test.go
    Dockerfile
    README.md
    ```

    Verify: `test -f .dockerignore`

13. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0
          - uses: actions/setup-go@b7ad1dad31e06c5925ef5d2fc7ad053ef454303e # v7.0.0
            with:
              go-version: '1.27.1'
          - run: go build ./...
          - run: go vet ./...
          - run: go run github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.14.0 run --enable-only errorlint ./...
          - run: go test ./...
    ```

    Verify: `test -f .github/workflows/ci.yml`

14. Create `README.md` with:

    ```markdown
    # service

    An HTTP service on Gin with bearer token verification.

    ## Run it

    It refuses to start without `JWT_SECRET`, `JWT_AUDIENCE` and `JWT_ISSUER`.
    That is deliberate: see `AGENTS.md`.

    On SIGTERM or Ctrl+C it stops accepting connections and gives the
    requests already running up to eight seconds to finish.

    ## Add a route

    Inside the protected group, so it is authenticated by where it is declared
    rather than by anyone remembering. `/health` is the one exception and the
    reason is in the comment beside it.
    ```

    Verify: `test -f README.md`

15. Tidy the module so the checked-in files match what is imported: `go mod tidy`
    Verify: `test -f go.sum`

16. Confirm the module's Go floor and the builder image agree. `go get` raises the floor when a dependency demands it, and the build then fails inside Docker rather than here: `grep -oE "^go 1\.[0-9]+" go.mod | grep -oE "1\.[0-9]+" > go.floor && grep -oE "golang:1\.[0-9]+" Dockerfile | grep -oE "1\.[0-9]+" > image.floor`
    Verify: `diff go.floor image.floor`

17. Build it: `go build ./...`
    Verify: `go build ./...`

18. Check it for the mistakes the compiler allows: `go vet ./...`
    Verify: `go vet ./...`

19. Check that no error is compared with `==` or `!=`, which stops matching the day anything wraps the error. The linter is pinned and built from the module proxy, and nothing is added to `go.mod`: `go run github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.14.0 run --enable-only errorlint ./...`
    Verify: `go run github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.14.0 run --enable-only errorlint ./...`

20. Run the tests, including the one that shuts the server down under a request in flight: `go test ./...`
    Verify: `go test ./...`

21. Build the container image: `docker build -t go-http-service:dev .`
    Verify: `docker image inspect go-http-service:dev > /dev/null`

22. Remove a check container left behind by an earlier attempt, so this does not depend on a clean machine: `docker rm --force service-check > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker ps -aq --filter name=service-check)"`

23. Start the container. It takes its configuration from the environment and refuses to start without it, so all three are supplied here: `docker run -d --name service-check -e JWT_SECRET="local-development-only-not-a-real-secret" -e JWT_AUDIENCE="service" -e JWT_ISSUER="service" -p 127.0.0.1::8080 go-http-service:dev`
    Verify: `test -n "$(docker ps -q --filter name=service-check)"`

24. Read the port the operating system chose: `docker port service-check 8080 | head -1 > service.url`
    Verify: `test -s service.url`

25. Confirm the service answers, which proves the image runs as a non-root user with no shell: `curl -fsS --retry 30 --retry-all-errors --retry-delay 1 -o health.json "http://$(cat service.url)/health"`
    Verify: `grep -q '"status":"ok"' health.json`

26. Confirm a protected route refuses a request with no token. This is the step that proves the group is wired, and it fails loudly the day somebody declares a route outside it: `curl -sS -o refused.json -w "%{http_code}" "http://$(cat service.url)/items" > refused.code`
    Verify: `grep -q '^401$' refused.code`

27. Stop the container the way an orchestrator does. `docker stop` sends SIGTERM and waits ten seconds before it sends SIGKILL, and it exits 0 either way — so the proof is the container's own exit code: 0 means the service drained and exited by itself inside the window, 137 that it had to be killed: `docker stop --time 10 service-check`
    Verify: `test "$(docker inspect --format '{{.State.ExitCode}}' service-check)" = "0"`

28. Remove the check container: `docker rm service-check`
    Verify: `test -z "$(docker ps -aq --filter name=service-check)"`
