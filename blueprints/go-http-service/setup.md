# Setup

Creates an HTTP service in Go on Gin, with bearer token verification, tests
that prove an unauthenticated request is refused, a distroless container and
CI.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Go 1.25 or newer and Docker.

1. Start the module: `go mod init example.com/service`
   Verify: `test -f go.mod`

2. Set the module's Go floor explicitly. `go mod init` writes whatever toolchain happens to be installed, so without this the module declares the author's version and the pinned builder image no longer satisfies it — on one machine and not another: `go mod edit -go=1.25`
   Verify: `grep -qE "^go 1\.25" go.mod`

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

7. Create `main.go` with:

   ```go
   package main

   import (
   	"fmt"
   	"log"
   	"net/http"
   	"os"
   	"time"

   	"example.com/service/internal/api"
   	"example.com/service/internal/auth"
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

   	server := &http.Server{
   		Addr:    ":" + port,
   		Handler: api.New(settings),
   		// Without this a slow client can hold a connection open indefinitely
   		// while sending headers one byte at a time.
   		ReadHeaderTimeout: 5 * time.Second,
   	}

   	log.Printf("listening on %s", server.Addr)
   	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
   		log.Fatal(err)
   	}
   }
   ```

   Verify: `test -f main.go`

8. Create `.gitignore` with:

   ```text
   service
   service.exe
   /dist/
   ```

   Verify: `test -f .gitignore`

9. Create `Dockerfile` with:

   ```dockerfile
   # The builder's Go version has to satisfy the `go` directive in go.mod,
   # and that directive is set by the dependencies rather than by preference:
   # gin 1.12 requires 1.25. Step 13 checks the two still agree, because
   # `go get` can raise the floor and the build then fails here instead.
   FROM golang:1.25-alpine AS build
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
   FROM gcr.io/distroless/static-debian12:nonroot
   COPY --from=build /out/service /service
   USER nonroot:nonroot
   EXPOSE 8080
   ENTRYPOINT ["/service"]
   ```

   Verify: `test -f Dockerfile`

10. Create `.dockerignore` with:

```text
.git
*_test.go
Dockerfile
README.md
```

Verify: `test -f .dockerignore`

11. Create `.github/workflows/ci.yml` with:

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
          - uses: actions/setup-go@d35c59abb061a4a6fb18e82ac0862c26744d6ab5 # v5.5.0
            with:
              go-version: '1.25'
          - run: go build ./...
          - run: go vet ./...
          - run: go test ./...
    ```

    Verify: `test -f .github/workflows/ci.yml`

12. Create `README.md` with:

    ```markdown
    # service

    An HTTP service on Gin with bearer token verification.

    ## Run it

    It refuses to start without `JWT_SECRET`, `JWT_AUDIENCE` and `JWT_ISSUER`.
    That is deliberate: see `AGENTS.md`.

    ## Add a route

    Inside the protected group, so it is authenticated by where it is declared
    rather than by anyone remembering. `/health` is the one exception and the
    reason is in the comment beside it.
    ```

    Verify: `test -f README.md`

13. Tidy the module so the checked-in files match what is imported: `go mod tidy`
    Verify: `test -f go.sum`

14. Confirm the module's Go floor and the builder image agree. `go get` raises the floor when a dependency demands it, and the build then fails inside Docker rather than here: `grep -oE "^go 1\.[0-9]+" go.mod | grep -oE "1\.[0-9]+" > go.floor && grep -oE "golang:1\.[0-9]+-alpine" Dockerfile | grep -oE "1\.[0-9]+" > image.floor`
    Verify: `diff go.floor image.floor`

15. Build it: `go build ./...`
    Verify: `go build ./...`

16. Check it for the mistakes the compiler allows: `go vet ./...`
    Verify: `go vet ./...`

17. Run the tests: `go test ./...`
    Verify: `go test ./...`

18. Build the container image: `docker build -t go-http-service:dev .`
    Verify: `docker image inspect go-http-service:dev > /dev/null`

19. Remove a check container left behind by an earlier attempt, so this does not depend on a clean machine: `docker rm --force service-check > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker ps -aq --filter name=service-check)"`

20. Start the container. It takes its configuration from the environment and refuses to start without it, so all three are supplied here: `docker run -d --name service-check -e JWT_SECRET="local-development-only-not-a-real-secret" -e JWT_AUDIENCE="service" -e JWT_ISSUER="service" -p 127.0.0.1::8080 go-http-service:dev`
    Verify: `test -n "$(docker ps -q --filter name=service-check)"`

21. Read the port the operating system chose: `docker port service-check 8080 | head -1 > service.url`
    Verify: `test -s service.url`

22. Confirm the service answers, which proves the image runs as a non-root user with no shell: `curl -fsS --retry 30 --retry-all-errors --retry-delay 1 -o health.json "http://$(cat service.url)/health"`
    Verify: `grep -q '"status":"ok"' health.json`

23. Confirm a protected route refuses a request with no token. This is the step that proves the group is wired, and it fails loudly the day somebody declares a route outside it: `curl -sS -o refused.json -w "%{http_code}" "http://$(cat service.url)/items" > refused.code`
    Verify: `grep -q '^401$' refused.code`

24. Stop the check container: `docker rm --force service-check`
    Verify: `test -z "$(docker ps -q --filter name=service-check)"`
