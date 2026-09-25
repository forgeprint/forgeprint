# Setup

Creates a Spring Boot 4.1 API on Java 25: an OAuth2 resource server that
validates JWTs, Bean Validation at the boundary, RFC 9457 problem details,
Flyway migrations against PostgreSQL, OpenAPI documentation, Actuator health
probes, integration tests on a Testcontainers PostgreSQL, a layered non-root
container image and CI.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Java 25, Docker and curl. Maven is not required: the recipe installs
the Maven wrapper, which downloads a pinned Maven and checks its SHA-256.

1. Download the Maven wrapper scripts from Maven Central: `curl -fsSL -o maven-wrapper.zip https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper-distribution/3.3.4/maven-wrapper-distribution-3.3.4-only-script.zip`
   Verify: `test -s maven-wrapper.zip`

2. Record the checksum the archive must have, read from the published archive on 2026-09-24 and cross-checked against Maven Central's own SHA-1: `echo "6cb584c2bc907b849a0b931d8266d3ff3214cdd3127115ed4f49fb7176413d36  maven-wrapper.zip" > maven-wrapper.zip.sha256`
   Verify: `sha256sum -c maven-wrapper.zip.sha256`

3. Extract the two wrapper scripts with the JDK's own archive tool: `jar xf maven-wrapper.zip mvnw mvnw.cmd`
   Verify: `test -f mvnw && test -f mvnw.cmd`

4. Make the POSIX script executable: `chmod +x mvnw`
   Verify: `test -x mvnw`

5. Remove the archive and its checksum, which are not part of the project: `rm maven-wrapper.zip maven-wrapper.zip.sha256`
   Verify: `test ! -e maven-wrapper.zip`

6. Create `.mvn/wrapper/maven-wrapper.properties` with:

   ```properties
   # The wrapper downloads exactly this Maven and refuses it if the SHA-256
   # differs. Upgrading Maven means changing both lines together.
   wrapperVersion=3.3.4
   distributionType=only-script
   distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.16/apache-maven-3.9.16-bin.zip
   distributionSha256Sum=5af3b743dd8b876b5c45da33b676251e5f1687712644abb4ee519ca56e1d89ce
   ```

   Verify: `./mvnw --version | grep -q "Apache Maven 3.9.16"`

7. Create `pom.xml` with:

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <project>
     <modelVersion>4.0.0</modelVersion>

     <!-- The parent pins every Spring, Jackson, Flyway, PostgreSQL driver and
          Testcontainers version below. Upgrading Spring Boot is this one line;
          a version written on a managed dependency would silently stop moving
          with it. -->
     <parent>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-parent</artifactId>
       <version>4.1.1</version>
       <relativePath/>
     </parent>

     <groupId>com.example</groupId>
     <artifactId>service</artifactId>
     <version>0.1.0</version>

     <properties>
       <java.version>25</java.version>
       <!-- Not managed by Spring Boot, so pinned here. 3.1 is the line built
            against Spring Boot 4.1. -->
       <springdoc.version>3.1.1</springdoc.version>
     </properties>

     <dependencies>
       <dependency>
         <groupId>org.springframework.boot</groupId>
         <artifactId>spring-boot-starter-webmvc</artifactId>
       </dependency>
       <dependency>
         <groupId>org.springframework.boot</groupId>
         <artifactId>spring-boot-starter-validation</artifactId>
       </dependency>
       <dependency>
         <groupId>org.springframework.boot</groupId>
         <artifactId>spring-boot-starter-security-oauth2-resource-server</artifactId>
       </dependency>
       <dependency>
         <groupId>org.springframework.boot</groupId>
         <artifactId>spring-boot-starter-jdbc</artifactId>
       </dependency>
       <dependency>
         <groupId>org.springframework.boot</groupId>
         <artifactId>spring-boot-starter-flyway</artifactId>
       </dependency>
       <dependency>
         <groupId>org.flywaydb</groupId>
         <artifactId>flyway-database-postgresql</artifactId>
       </dependency>
       <dependency>
         <groupId>org.springframework.boot</groupId>
         <artifactId>spring-boot-starter-actuator</artifactId>
       </dependency>
       <dependency>
         <groupId>org.springdoc</groupId>
         <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
         <version>${springdoc.version}</version>
       </dependency>
       <dependency>
         <groupId>org.postgresql</groupId>
         <artifactId>postgresql</artifactId>
         <scope>runtime</scope>
       </dependency>

       <dependency>
         <groupId>org.springframework.boot</groupId>
         <artifactId>spring-boot-starter-webmvc-test</artifactId>
         <scope>test</scope>
       </dependency>
       <dependency>
         <groupId>org.springframework.boot</groupId>
         <artifactId>spring-boot-testcontainers</artifactId>
         <scope>test</scope>
       </dependency>
       <dependency>
         <groupId>org.testcontainers</groupId>
         <artifactId>testcontainers-postgresql</artifactId>
         <scope>test</scope>
       </dependency>
     </dependencies>

     <build>
       <!-- A fixed name, so the Dockerfile does not need a wildcard that
            matches two jars the day a second one appears in target/. -->
       <finalName>service</finalName>
       <plugins>
         <plugin>
           <groupId>org.springframework.boot</groupId>
           <artifactId>spring-boot-maven-plugin</artifactId>
         </plugin>
       </plugins>
     </build>
   </project>
   ```

   Verify: `./mvnw -B -ntp -q validate`

8. Create `src/main/java/com/example/service/Application.java` with:

   ```java
   package com.example.service;

   import org.springframework.boot.SpringApplication;
   import org.springframework.boot.autoconfigure.SpringBootApplication;
   import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

   @SpringBootApplication
   @ConfigurationPropertiesScan
   public class Application {

       public static void main(String[] args) {
           SpringApplication.run(Application.class, args);
       }
   }
   ```

   Verify: `test -f src/main/java/com/example/service/Application.java`

9. Create `src/main/java/com/example/service/security/TokenSettings.java` with:

   ```java
   package com.example.service.security;

   import jakarta.validation.constraints.NotBlank;
   import jakarta.validation.constraints.NotNull;
   import java.net.URI;
   import org.springframework.boot.context.properties.ConfigurationProperties;
   import org.springframework.validation.annotation.Validated;

   /**
    * Who may issue a token this service accepts, and for whom it must be minted.
    *
    * Bound from APP_TOKEN_ISSUER, APP_TOKEN_AUDIENCE and APP_TOKEN_JWKS. There is
    * deliberately no default for any of them: a missing value stops the process
    * at startup, because a service that starts without knowing whose tokens to
    * trust either trusts none (and answers 401 to everyone while its health
    * check says it is fine) or, worse, somebody else's.
    */
   @Validated
   @ConfigurationProperties(prefix = "app.token")
   public record TokenSettings(
           @NotBlank String issuer,
           @NotBlank String audience,
           @NotNull URI jwks) {
   }
   ```

   Verify: `test -f src/main/java/com/example/service/security/TokenSettings.java`

10. Create `src/main/java/com/example/service/security/TokenRules.java` with:

    ```java
    package com.example.service.security;

    import java.time.Instant;
    import java.util.List;
    import java.util.Objects;
    import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
    import org.springframework.security.oauth2.core.OAuth2TokenValidator;
    import org.springframework.security.oauth2.jwt.Jwt;
    import org.springframework.security.oauth2.jwt.JwtClaimNames;
    import org.springframework.security.oauth2.jwt.JwtClaimValidator;
    import org.springframework.security.oauth2.jwt.JwtValidators;

    /**
     * The one definition of an acceptable token. Production and the tests both
     * build their decoder with this validator, so a test that accepts a token is
     * a statement about production rather than about a test double.
     */
    public final class TokenRules {

        private TokenRules() {
        }

        public static OAuth2TokenValidator<Jwt> validator(TokenSettings settings) {
            return new DelegatingOAuth2TokenValidator<>(
                    // Signature is checked by the decoder; this adds the
                    // timestamps (with Spring's 60 s clock skew) and the issuer.
                    JwtValidators.createDefaultWithIssuer(settings.issuer()),
                    // A token minted for another service must not work here.
                    new JwtClaimValidator<List<String>>(JwtClaimNames.AUD,
                            audience -> audience != null && audience.contains(settings.audience())),
                    // The timestamp validator only checks exp when it is present.
                    // A token with no expiry would be valid forever.
                    new JwtClaimValidator<Instant>(JwtClaimNames.EXP, Objects::nonNull),
                    // Ownership is keyed on the subject; a token without one
                    // cannot own anything.
                    new JwtClaimValidator<String>(JwtClaimNames.SUB,
                            subject -> subject != null && !subject.isBlank()));
        }
    }
    ```

    Verify: `test -f src/main/java/com/example/service/security/TokenRules.java`

11. Create `src/main/java/com/example/service/security/SecurityConfig.java` with:

    ```java
    package com.example.service.security;

    import org.springframework.context.annotation.Bean;
    import org.springframework.context.annotation.Configuration;
    import org.springframework.http.HttpMethod;
    import org.springframework.security.config.Customizer;
    import org.springframework.security.config.annotation.web.builders.HttpSecurity;
    import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
    import org.springframework.security.config.http.SessionCreationPolicy;
    import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
    import org.springframework.security.oauth2.jwt.JwtDecoder;
    import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
    import org.springframework.security.web.SecurityFilterChain;

    @Configuration
    public class SecurityConfig {

        @Bean
        SecurityFilterChain api(HttpSecurity http) throws Exception {
            http
                    .authorizeHttpRequests(requests -> requests
                            // The only public paths, listed. Everything else,
                            // including a route added tomorrow by somebody who
                            // never opened this file, needs a valid token.
                            .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**").permitAll()
                            .requestMatchers(HttpMethod.GET, "/v3/api-docs", "/v3/api-docs/**",
                                    "/swagger-ui.html", "/swagger-ui/**").permitAll()
                            .anyRequest().authenticated())
                    .oauth2ResourceServer(server -> server.jwt(Customizer.withDefaults()))
                    // No session, no cookie: every request carries its bearer
                    // token. CSRF protection defends cookie-authenticated
                    // requests, and there are none, so it is off rather than
                    // half on. Adding a cookie login means turning it back on.
                    .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                    .csrf(AbstractHttpConfigurer::disable);
            return http.build();
        }

        /**
         * Keys come from the issuer's JWK Set, fetched on first use and cached,
         * so rotation at the issuer needs no redeploy here. RS256 only: a token
         * that names another algorithm, "none" included, is refused before any
         * claim is read.
         */
        @Bean
        JwtDecoder jwtDecoder(TokenSettings settings) {
            NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(settings.jwks().toString())
                    .jwsAlgorithm(SignatureAlgorithm.RS256)
                    .build();
            decoder.setJwtValidator(TokenRules.validator(settings));
            return decoder;
        }
    }
    ```

    Verify: `test -f src/main/java/com/example/service/security/SecurityConfig.java`

12. Create `src/main/java/com/example/service/OpenApiConfig.java` with:

    ```java
    package com.example.service;

    import io.swagger.v3.oas.annotations.OpenAPIDefinition;
    import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
    import io.swagger.v3.oas.annotations.info.Info;
    import io.swagger.v3.oas.annotations.security.SecurityRequirement;
    import io.swagger.v3.oas.annotations.security.SecurityScheme;
    import org.springframework.context.annotation.Configuration;

    /**
     * The document says how to authenticate, so a client generated from it
     * sends the bearer token without anybody reading the source.
     */
    @Configuration
    @OpenAPIDefinition(
            info = @Info(title = "service", version = "v1"),
            security = @SecurityRequirement(name = "bearer"))
    @SecurityScheme(name = "bearer", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
    public class OpenApiConfig {
    }
    ```

    Verify: `test -f src/main/java/com/example/service/OpenApiConfig.java`

13. Create `src/main/resources/db/migration/V1__create_items.sql` with:

    ```sql
    -- Applied by Flyway at startup, before the service accepts a request.
    -- A migration that has been applied anywhere is never edited: the next
    -- change is V2, because Flyway checksums every applied file and refuses
    -- to start when one no longer matches.
    CREATE TABLE items (
        id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
        owner      text        NOT NULL,
        name       text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
        created_at timestamptz NOT NULL DEFAULT now()
    );

    -- Every read is scoped to one owner, so every read uses this index.
    CREATE INDEX items_owner_created_at ON items (owner, created_at);
    ```

    Verify: `test -f src/main/resources/db/migration/V1__create_items.sql`

14. Create `src/main/java/com/example/service/items/Item.java` with:

    ```java
    package com.example.service.items;

    import java.time.OffsetDateTime;
    import java.util.UUID;

    /** What a caller sees. The owner is not in it: it is always the caller. */
    public record Item(UUID id, String name, OffsetDateTime createdAt) {
    }
    ```

    Verify: `test -f src/main/java/com/example/service/items/Item.java`

15. Create `src/main/java/com/example/service/items/CreateItemRequest.java` with:

    ```java
    package com.example.service.items;

    import jakarta.validation.constraints.NotBlank;
    import jakarta.validation.constraints.Size;

    /**
     * The request body, validated before the controller method runs. The limit
     * matches the CHECK constraint in V1, so the database never sees a value
     * the API would have refused, and a refusal is a 400 rather than a 500.
     */
    public record CreateItemRequest(@NotBlank @Size(max = 200) String name) {
    }
    ```

    Verify: `test -f src/main/java/com/example/service/items/CreateItemRequest.java`

16. Create `src/main/java/com/example/service/items/ItemRepository.java` with:

    ```java
    package com.example.service.items;

    import java.util.List;
    import java.util.Optional;
    import java.util.UUID;
    import org.springframework.jdbc.core.simple.JdbcClient;
    import org.springframework.stereotype.Repository;

    /**
     * Every query takes the owner and filters on it. There is no method that
     * reads an item by id alone, so a controller cannot forget the check: the
     * only way to reach a row is through the caller's subject.
     */
    @Repository
    public class ItemRepository {

        private final JdbcClient jdbc;

        public ItemRepository(JdbcClient jdbc) {
            this.jdbc = jdbc;
        }

        public List<Item> findByOwner(String owner, int limit) {
            return jdbc.sql("""
                    SELECT id, name, created_at FROM items
                    WHERE owner = :owner
                    ORDER BY created_at, id
                    LIMIT :limit
                    """)
                    .param("owner", owner)
                    .param("limit", limit)
                    .query(Item.class)
                    .list();
        }

        public Optional<Item> findByIdAndOwner(UUID id, String owner) {
            return jdbc.sql("SELECT id, name, created_at FROM items WHERE id = :id AND owner = :owner")
                    .param("id", id)
                    .param("owner", owner)
                    .query(Item.class)
                    .optional();
        }

        public Item create(String owner, String name) {
            return jdbc.sql("INSERT INTO items (owner, name) VALUES (:owner, :name) RETURNING id, name, created_at")
                    .param("owner", owner)
                    .param("name", name)
                    .query(Item.class)
                    .single();
        }
    }
    ```

    Verify: `test -f src/main/java/com/example/service/items/ItemRepository.java`

17. Create `src/main/java/com/example/service/items/ItemController.java` with:

    ```java
    package com.example.service.items;

    import jakarta.validation.Valid;
    import java.util.List;
    import java.util.UUID;
    import org.springframework.http.HttpStatus;
    import org.springframework.security.core.annotation.AuthenticationPrincipal;
    import org.springframework.security.oauth2.jwt.Jwt;
    import org.springframework.web.bind.annotation.GetMapping;
    import org.springframework.web.bind.annotation.PathVariable;
    import org.springframework.web.bind.annotation.PostMapping;
    import org.springframework.web.bind.annotation.RequestBody;
    import org.springframework.web.bind.annotation.RequestMapping;
    import org.springframework.web.bind.annotation.ResponseStatus;
    import org.springframework.web.bind.annotation.RestController;
    import org.springframework.web.server.ResponseStatusException;

    @RestController
    @RequestMapping("/api/items")
    public class ItemController {

        /** A list endpoint without a bound is a denial of service with a URL. */
        private static final int PAGE_SIZE = 100;

        private final ItemRepository items;

        public ItemController(ItemRepository items) {
            this.items = items;
        }

        @GetMapping
        public List<Item> list(@AuthenticationPrincipal Jwt caller) {
            return items.findByOwner(caller.getSubject(), PAGE_SIZE);
        }

        /**
         * Somebody else's item is 404, not 403: a 403 would confirm that the id
         * exists, which is itself something the caller is not entitled to know.
         */
        @GetMapping("/{id}")
        public Item get(@PathVariable UUID id, @AuthenticationPrincipal Jwt caller) {
            return items.findByIdAndOwner(id, caller.getSubject())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        }

        @PostMapping
        @ResponseStatus(HttpStatus.CREATED)
        public Item create(@Valid @RequestBody CreateItemRequest request, @AuthenticationPrincipal Jwt caller) {
            return items.create(caller.getSubject(), request.name());
        }
    }
    ```

    Verify: `test -f src/main/java/com/example/service/items/ItemController.java`

18. Create `src/main/resources/application.yaml` with:

    ```yaml
    # Nothing here is a secret and nothing here is environment specific. The
    # database comes from SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME and
    # SPRING_DATASOURCE_PASSWORD; the token rules from APP_TOKEN_ISSUER,
    # APP_TOKEN_AUDIENCE and APP_TOKEN_JWKS. Without them the service does not
    # start, which is the point.
    spring:
      application:
        name: service
      mvc:
        # Errors as RFC 9457 application/problem+json, including validation
        # failures and the 404 for an item the caller does not own.
        problemdetails:
          enabled: true

    management:
      endpoints:
        web:
          exposure:
            # Health only. Every other actuator endpoint describes the inside
            # of the process to whoever asks.
            include: health
      endpoint:
        health:
          show-details: never
          probes:
            enabled: true
          group:
            # Liveness touches nothing, so a slow database does not get the
            # process restarted. Readiness includes the database, so traffic
            # stops arriving while it is unreachable.
            readiness:
              include: readinessState,db

    springdoc:
      # The OpenAPI document and its UI describe every route. Off unless
      # API_DOCS_ENABLED=true, so publishing the inventory is a decision.
      api-docs:
        enabled: ${API_DOCS_ENABLED:false}
      swagger-ui:
        enabled: ${API_DOCS_ENABLED:false}
    ```

    Verify: `test -f src/main/resources/application.yaml`

19. Create `src/test/java/com/example/service/TestcontainersConfiguration.java` with:

    ```java
    package com.example.service;

    import java.time.Duration;
    import org.springframework.boot.test.context.TestConfiguration;
    import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
    import org.springframework.context.annotation.Bean;
    import org.testcontainers.postgresql.PostgreSQLContainer;

    /**
     * A real PostgreSQL, the same image the container check runs against. An
     * in-memory database would pass tests that production fails:
     * gen_random_uuid(), timestamptz and the CHECK constraint are all
     * PostgreSQL's, and so are the migrations.
     */
    @TestConfiguration(proxyBeanMethods = false)
    public class TestcontainersConfiguration {

        @Bean
        @ServiceConnection
        PostgreSQLContainer postgres() {
            // The first run initialises a cluster, which on a busy CI runner
            // can outlast the default minute. A slow start is not a failure.
            return new PostgreSQLContainer("postgres:18.6-alpine3.24")
                    .withStartupTimeout(Duration.ofMinutes(3));
        }
    }
    ```

    Verify: `test -f src/test/java/com/example/service/TestcontainersConfiguration.java`

20. Create `src/test/java/com/example/service/TestTokens.java` with:

    ```java
    package com.example.service;

    import com.example.service.security.TokenRules;
    import com.example.service.security.TokenSettings;
    import com.nimbusds.jose.jwk.JWKSet;
    import com.nimbusds.jose.jwk.RSAKey;
    import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
    import com.nimbusds.jose.proc.SecurityContext;
    import java.security.KeyPair;
    import java.security.KeyPairGenerator;
    import java.security.NoSuchAlgorithmException;
    import java.security.interfaces.RSAPrivateKey;
    import java.security.interfaces.RSAPublicKey;
    import java.time.Instant;
    import java.util.List;
    import org.springframework.boot.test.context.TestConfiguration;
    import org.springframework.context.annotation.Bean;
    import org.springframework.context.annotation.Primary;
    import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
    import org.springframework.security.oauth2.jwt.JwsHeader;
    import org.springframework.security.oauth2.jwt.JwtClaimsSet;
    import org.springframework.security.oauth2.jwt.JwtDecoder;
    import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
    import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
    import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

    /**
     * Keys generated for this test run and never written anywhere. The decoder
     * trusts SIGNING's public key instead of fetching a JWK Set, and applies the
     * production TokenRules, so everything except where the key comes from is
     * the code that ships.
     */
    @TestConfiguration(proxyBeanMethods = false)
    public class TestTokens {

        public static final String ISSUER = "https://example.com/test-issuer";
        public static final String AUDIENCE = "service-tests";

        static final KeyPair SIGNING = rsa();
        /** A well-formed key the service has never been told to trust. */
        static final KeyPair FORGER = rsa();

        @Bean
        @Primary
        JwtDecoder testJwtDecoder(TokenSettings settings) {
            NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey((RSAPublicKey) SIGNING.getPublic())
                    .signatureAlgorithm(SignatureAlgorithm.RS256)
                    .build();
            decoder.setJwtValidator(TokenRules.validator(settings));
            return decoder;
        }

        static String token(String subject) {
            return token(SIGNING, subject, AUDIENCE, Instant.now().plusSeconds(300));
        }

        static String token(KeyPair keys, String subject, String audience, Instant expiresAt) {
            RSAKey key = new RSAKey.Builder((RSAPublicKey) keys.getPublic())
                    .privateKey((RSAPrivateKey) keys.getPrivate())
                    .build();
            NimbusJwtEncoder encoder = new NimbusJwtEncoder(new ImmutableJWKSet<SecurityContext>(new JWKSet(key)));
            JwtClaimsSet claims = JwtClaimsSet.builder()
                    .issuer(ISSUER)
                    .subject(subject)
                    .audience(List.of(audience))
                    .issuedAt(expiresAt.minusSeconds(600))
                    .expiresAt(expiresAt)
                    .build();
            JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).build();
            return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        }

        private static KeyPair rsa() {
            try {
                KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
                generator.initialize(2048);
                return generator.generateKeyPair();
            } catch (NoSuchAlgorithmException e) {
                throw new IllegalStateException(e);
            }
        }
    }
    ```

    Verify: `test -f src/test/java/com/example/service/TestTokens.java`

21. Create `src/test/java/com/example/service/ApiTest.java` with:

    ```java
    package com.example.service;

    import static org.hamcrest.Matchers.containsString;
    import static org.hamcrest.Matchers.hasItem;
    import static org.hamcrest.Matchers.not;
    import static org.hamcrest.Matchers.startsWith;
    import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
    import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
    import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
    import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
    import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
    import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

    import com.jayway.jsonpath.JsonPath;
    import java.time.Instant;
    import java.util.UUID;
    import org.junit.jupiter.api.Test;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.boot.test.context.SpringBootTest;
    import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
    import org.springframework.context.annotation.Import;
    import org.springframework.http.MediaType;
    import org.springframework.test.web.servlet.MockMvc;

    /**
     * The whole application, its real security filter chain, Flyway and a real
     * PostgreSQL. Each test uses its own subject, so the tests share a database
     * without depending on each other's rows.
     */
    @SpringBootTest(properties = {
            "app.token.issuer=" + TestTokens.ISSUER,
            "app.token.audience=" + TestTokens.AUDIENCE,
            "app.token.jwks=https://example.com/never-fetched-in-tests",
            "API_DOCS_ENABLED=true"
    })
    @AutoConfigureMockMvc
    @Import({TestcontainersConfiguration.class, TestTokens.class})
    class ApiTest {

        @Autowired
        MockMvc mvc;

        private static String caller() {
            return "user-" + UUID.randomUUID();
        }

        private static String bearer(String token) {
            return "Bearer " + token;
        }

        @Test
        void livenessNeedsNoToken() throws Exception {
            mvc.perform(get("/actuator/health/liveness"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("UP"));
        }

        @Test
        void readinessIncludesTheMigratedDatabase() throws Exception {
            mvc.perform(get("/actuator/health/readiness"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("UP"));
        }

        @Test
        void aRequestWithNoTokenIsRefused() throws Exception {
            mvc.perform(get("/api/items"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(header().string("WWW-Authenticate", startsWith("Bearer")));
        }

        @Test
        void aPathNobodyMappedIsRefusedRatherThanFound() throws Exception {
            // Deny by default: an unauthenticated caller learns nothing about
            // which paths exist, and a route added later starts out protected.
            mvc.perform(get("/api/not-a-route"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void aTokenSignedByAnUntrustedKeyIsRefused() throws Exception {
            // The test that fails the day verification is reduced to decoding.
            String forged = TestTokens.token(TestTokens.FORGER, caller(), TestTokens.AUDIENCE,
                    Instant.now().plusSeconds(300));
            mvc.perform(get("/api/items").header("Authorization", bearer(forged)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void aTokenForAnotherAudienceIsRefused() throws Exception {
            String elsewhere = TestTokens.token(TestTokens.SIGNING, caller(), "another-service",
                    Instant.now().plusSeconds(300));
            mvc.perform(get("/api/items").header("Authorization", bearer(elsewhere)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void anExpiredTokenIsRefused() throws Exception {
            String expired = TestTokens.token(TestTokens.SIGNING, caller(), TestTokens.AUDIENCE,
                    Instant.now().minusSeconds(600));
            mvc.perform(get("/api/items").header("Authorization", bearer(expired)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void aCreatedItemIsListedForItsOwner() throws Exception {
            String owner = TestTokens.token(caller());

            mvc.perform(post("/api/items")
                            .header("Authorization", bearer(owner))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"first\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.name").value("first"));

            mvc.perform(get("/api/items").header("Authorization", bearer(owner)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[*].name", hasItem("first")));
        }

        @Test
        void anotherCallerCannotReadOrListIt() throws Exception {
            String owner = TestTokens.token(caller());
            String stranger = TestTokens.token(caller());

            String created = mvc.perform(post("/api/items")
                            .header("Authorization", bearer(owner))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"private\"}"))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            String id = JsonPath.read(created, "$.id");

            mvc.perform(get("/api/items/" + id).header("Authorization", bearer(owner)))
                    .andExpect(status().isOk());

            // OWASP API1:2023: knowing the id is not the same as owning the row.
            mvc.perform(get("/api/items/" + id).header("Authorization", bearer(stranger)))
                    .andExpect(status().isNotFound())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));

            mvc.perform(get("/api/items").header("Authorization", bearer(stranger)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[*].id", not(hasItem(id))));
        }

        @Test
        void anInvalidBodyIsAProblemDetail() throws Exception {
            mvc.perform(post("/api/items")
                            .header("Authorization", bearer(TestTokens.token(caller())))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"name\":\"\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                    .andExpect(jsonPath("$.status").value(400));
        }

        @Test
        void theApiDocumentDescribesTheRoutesAndTheBearerScheme() throws Exception {
            mvc.perform(get("/v3/api-docs"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(containsString("/api/items")))
                    .andExpect(jsonPath("$.components.securitySchemes.bearer.scheme").value("bearer"));
        }
    }
    ```

    Verify: `test -f src/test/java/com/example/service/ApiTest.java`

22. Create `.gitignore` with:

    ```text
    target/
    .idea/
    *.iml
    .vscode/
    ```

    Verify: `test -f .gitignore`

23. Create `.dockerignore` with:

    ```text
    # The image is built from the jar Maven produced, and from nothing else:
    # no source, no tests, no .git, no local configuration.
    *
    !target/service.jar
    ```

    Verify: `test -f .dockerignore`

24. Create `Dockerfile` with:

    ```dockerfile
    # Build the jar first: ./mvnw -B -ntp verify. The image is assembled from
    # that jar, so what was tested is what ships.

    # Split the jar into layers: dependencies change rarely, the application
    # on every commit, so a rebuild re-sends only the last layer.
    FROM eclipse-temurin:25.0.4_7-jre-noble AS layers
    WORKDIR /build
    COPY target/service.jar application.jar
    RUN java -Djarmode=tools -jar application.jar extract --layers --destination extracted

    FROM eclipse-temurin:25.0.4_7-jre-noble
    # A fixed numeric user, so an orchestrator's "run as non-root" check can
    # verify it without resolving a name inside the image.
    RUN groupadd --system --gid 10001 app \
        && useradd --system --uid 10001 --gid app --no-create-home --shell /usr/sbin/nologin app
    WORKDIR /app
    COPY --from=layers /build/extracted/dependencies/ ./
    COPY --from=layers /build/extracted/spring-boot-loader/ ./
    COPY --from=layers /build/extracted/snapshot-dependencies/ ./
    COPY --from=layers /build/extracted/application/ ./
    USER 10001:10001
    EXPOSE 8080
    # The JVM sizes its heap from the container's memory limit; the default
    # of a quarter of it leaves most of a small container unused.
    ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "application.jar"]
    ```

    Verify: `test -f Dockerfile`

25. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      build:
        runs-on: ubuntu-24.04
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-java@de7274f081f381c8f8158605e0321c36c376e2e6 # v6.0.1
            with:
              distribution: temurin
              java-version: '25'
              cache: maven
          # --strict-checksums fails the build when a downloaded artifact does
          # not match the checksum the repository publishes for it. The tests
          # start PostgreSQL through Testcontainers on the runner's Docker.
          - run: ./mvnw -B -ntp --strict-checksums verify
          - run: docker build -t service:ci .
    ```

    Verify: `test -f .github/workflows/ci.yml`

26. Create `README.md` with:

    ```markdown
    # service

    A Spring Boot API that accepts OAuth2 bearer tokens, keeps its data in
    PostgreSQL and describes itself with OpenAPI.

    ## Run it

    It refuses to start without a database (SPRING_DATASOURCE_URL,
    SPRING_DATASOURCE_USERNAME, SPRING_DATASOURCE_PASSWORD) and without the
    token rules (APP_TOKEN_ISSUER, APP_TOKEN_AUDIENCE, APP_TOKEN_JWKS). That is
    deliberate: see AGENTS.md.

    Build and test with ./mvnw verify. The tests need Docker, because they run
    against a real PostgreSQL.

    ## Add an endpoint

    It is protected without doing anything: every path except health and the
    API document needs a valid token. Read the caller from the Jwt principal,
    and pass its subject to the repository.

    ## Change the schema

    Add a new file under src/main/resources/db/migration. Never edit one that
    has been applied.
    ```

    Verify: `test -f README.md`

27. Build, run the tests against a Testcontainers PostgreSQL, and package the jar: `./mvnw -B -ntp --strict-checksums verify`
    Verify: `test -f target/service.jar`

28. Build the container image: `docker build -t spring-boot-api:dev .`
    Verify: `docker image inspect spring-boot-api:dev > /dev/null`

29. Record the user the image runs as: `docker image inspect --format "{{.Config.User}}" spring-boot-api:dev > target/image.user`
    Verify: `grep -qx "10001:10001" target/image.user`

30. Remove check containers left behind by an earlier attempt, so this does not depend on a clean machine: `docker rm --force spring-boot-api-check spring-boot-api-db > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker ps -aq --filter name=spring-boot-api-check --filter name=spring-boot-api-db)"`

31. Remove a check network left behind by an earlier attempt: `docker network rm spring-boot-api-net > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker network ls -q --filter name=spring-boot-api-net)"`

32. Create a network the two check containers share, so the database needs no published port: `docker network create spring-boot-api-net`
    Verify: `docker network inspect spring-boot-api-net > /dev/null`

33. Start PostgreSQL for the check, with a password that is obviously not a real one: `docker run -d --name spring-boot-api-db --network spring-boot-api-net -e POSTGRES_DB=app -e POSTGRES_USER=app -e POSTGRES_PASSWORD=local-development-only-not-a-real-secret postgres:18.6-alpine3.24`
    Verify: `test -n "$(docker ps -q --filter name=spring-boot-api-db)"`

34. Wait until PostgreSQL accepts TCP connections. The image's first-run initialisation listens on a socket only, so a TCP check does not mistake it for the real server: `for attempt in $(seq 1 120); do docker exec spring-boot-api-db pg_isready -h 127.0.0.1 -U app -d app > /dev/null && break; sleep 1; done`
    Verify: `docker exec spring-boot-api-db pg_isready -h 127.0.0.1 -U app -d app`

35. Start the service. It refuses to start without its database and token settings, so every one is supplied; the JWK Set address is never fetched, because no request in this check carries a token: `docker run -d --name spring-boot-api-check --network spring-boot-api-net -e SPRING_DATASOURCE_URL=jdbc:postgresql://spring-boot-api-db:5432/app -e SPRING_DATASOURCE_USERNAME=app -e SPRING_DATASOURCE_PASSWORD=local-development-only-not-a-real-secret -e APP_TOKEN_ISSUER=https://example.com -e APP_TOKEN_AUDIENCE=service -e APP_TOKEN_JWKS=https://example.com/jwks.json -p 127.0.0.1::8080 spring-boot-api:dev`
    Verify: `test -n "$(docker ps -q --filter name=spring-boot-api-check)"`

36. Read the port the operating system chose: `docker port spring-boot-api-check 8080 | head -1 > target/service.url`
    Verify: `test -s target/service.url`

37. Wait for liveness, which proves the image starts as its non-root user: `curl -fsS --retry 90 --retry-all-errors --retry-delay 1 -o target/liveness.json "http://$(cat target/service.url)/actuator/health/liveness"`
    Verify: `grep -q '"status":"UP"' target/liveness.json`

38. Check readiness, which includes the database and so proves Flyway migrated it at startup: `curl -fsS --retry 30 --retry-all-errors --retry-delay 1 -o target/readiness.json "http://$(cat target/service.url)/actuator/health/readiness"`
    Verify: `grep -q '"status":"UP"' target/readiness.json`

39. Confirm the running image refuses a request with no token: `curl -sS -o /dev/null -w "%{http_code}" "http://$(cat target/service.url)/api/items" > target/refused.code`
    Verify: `grep -qx "401" target/refused.code`

40. Stop the service container: `docker rm --force spring-boot-api-check`
    Verify: `test -z "$(docker ps -aq --filter name=spring-boot-api-check)"`

41. Stop the database container: `docker rm --force spring-boot-api-db`
    Verify: `test -z "$(docker ps -aq --filter name=spring-boot-api-db)"`

42. Remove the check network: `docker network rm spring-boot-api-net`
    Verify: `test -z "$(docker network ls -q --filter name=spring-boot-api-net)"`
