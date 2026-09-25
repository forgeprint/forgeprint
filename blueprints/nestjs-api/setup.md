# Setup

Creates a NestJS 12 HTTP API in strict TypeScript on Postgres: a global bearer
token guard with an explicit `@Public()` opt-out, validated input, RFC 9457
problem details for every error, TypeORM migrations, OpenAPI, end-to-end tests
against a real database, a non-root container image and CI.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Node.js 22.13 or newer, Docker with Compose, and curl.

1. Create `package.json` with:

   ```json
   {
     "name": "api",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "engines": {
       "node": ">=22.13"
     },
     "scripts": {
       "build": "tsc -p tsconfig.build.json",
       "start": "node dist/src/main.js",
       "test": "tsc -p tsconfig.json && node --test --test-concurrency=1 \"dist/test/**/*.test.js\"",
       "migration:run": "typeorm migration:run -d dist/src/database/data-source.js",
       "migration:generate": "typeorm migration:generate -d dist/src/database/data-source.js",
       "migration:check": "typeorm migration:generate --check -d dist/src/database/data-source.js src/database/migrations/pending"
     },
     "dependencies": {
       "@nestjs/common": "12.1.0",
       "@nestjs/config": "12.0.1",
       "@nestjs/core": "12.1.0",
       "@nestjs/jwt": "12.0.2",
       "@nestjs/platform-express": "12.1.0",
       "@nestjs/swagger": "12.0.2",
       "@nestjs/typeorm": "12.0.1",
       "class-transformer": "0.5.1",
       "class-validator": "0.15.1",
       "pg": "8.23.0",
       "reflect-metadata": "0.2.2",
       "rxjs": "7.8.2",
       "typeorm": "1.1.1"
     },
     "devDependencies": {
       "@nestjs/testing": "12.1.0",
       "@types/express": "5.0.6",
       "@types/node": "22.20.4",
       "@types/supertest": "7.2.1",
       "supertest": "7.3.0",
       "typescript": "6.0.3"
     }
   }
   ```

   Verify: `test -f package.json`

2. Create `tsconfig.json` with:

   ```json
   {
     "compilerOptions": {
       "target": "es2023",
       "module": "nodenext",
       "moduleResolution": "nodenext",
       "outDir": "dist",
       "rootDir": ".",
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitOverride": true,
       "experimentalDecorators": true,
       "emitDecoratorMetadata": true,
       "useDefineForClassFields": false,
       "skipLibCheck": true,
       "sourceMap": true,
       "types": ["node"]
     },
     "include": ["src", "test"]
   }
   ```

   Verify: `test -f tsconfig.json`

3. Create `tsconfig.build.json`, which builds the service without its tests, with:

   ```json
   {
     "extends": "./tsconfig.json",
     "include": ["src"]
   }
   ```

   Verify: `test -f tsconfig.build.json`

4. Install the pinned dependencies. This writes `package-lock.json`, which the image installs from: `npm install --no-audit --no-fund`
   Verify: `npm ls --depth=0`

5. Create `src/config/environment.ts` with:

   ```typescript
   import { plainToInstance, Type } from 'class-transformer';
   import {
     IsIn,
     IsInt,
     IsNotEmpty,
     IsString,
     Matches,
     Max,
     Min,
     MinLength,
     validateSync,
   } from 'class-validator';

   /**
    * Every setting the service reads, and the only place that says what a valid
    * one looks like. Nothing that authenticates or connects has a default: a
    * missing secret stops the process instead of starting one that is open.
    */
   export class Environment {
     @IsString()
     @Matches(/^postgres(ql)?:\/\//, { message: 'DATABASE_URL must be a postgres:// URL' })
     DATABASE_URL!: string;

     // HS256 with a short key is guessable offline from any token it signed.
     @IsString()
     @MinLength(32)
     JWT_SECRET!: string;

     @IsString()
     @IsNotEmpty()
     JWT_AUDIENCE!: string;

     @IsString()
     @IsNotEmpty()
     JWT_ISSUER!: string;

     // Everything in the environment is a string; this one is converted, and a
     // value that is not a port is refused rather than parsed as NaN.
     @Type(() => Number)
     @IsInt()
     @Min(1)
     @Max(65535)
     PORT: number = 3000;

     // The OpenAPI UI is served outside the guard, so it is off unless asked for.
     @IsIn(['enabled', 'disabled'])
     API_DOCS: 'enabled' | 'disabled' = 'disabled';
   }

   /**
    * Called once, by ConfigModule, before anything is constructed. The error
    * names the settings that failed and never their values: a secret that is
    * merely too short is still a secret.
    */
   export function validateEnvironment(raw: Record<string, unknown>): Environment {
     const environment = plainToInstance(Environment, raw, { enableImplicitConversion: true });
     const errors = validateSync(environment, { skipMissingProperties: false });
     if (errors.length > 0) {
       const names = errors.map((error) => error.property).join(', ');
       throw new Error(`invalid or missing configuration: ${names}`);
     }
     return environment;
   }
   ```

   Verify: `test -f src/config/environment.ts`

6. Create `src/auth/decorators.ts` with:

   ```typescript
   import {
     createParamDecorator,
     SetMetadata,
     UnauthorizedException,
     type ExecutionContext,
   } from '@nestjs/common';

   import type { AuthenticatedRequest } from './jwt-auth.guard.js';

   export const IS_PUBLIC = 'auth:is-public';

   /**
    * The only way to open a route. The guard denies everything else, so a
    * public route is a decision somebody wrote down, and a test lists them.
    */
   export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC, true);

   /** The verified `sub` claim of the caller. Never read identity from the body. */
   export const Subject = createParamDecorator((_: unknown, context: ExecutionContext): string => {
     const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
     // Unreachable behind the guard; a route marked @Public() that asks for a
     // subject is a bug, and it fails as a refusal rather than as a null owner.
     if (request.user === undefined) throw new UnauthorizedException();
     return request.user.sub;
   });
   ```

   Verify: `test -f src/auth/decorators.ts`

7. Create `src/auth/jwt-auth.guard.ts` with:

   ```typescript
   import {
     Injectable,
     UnauthorizedException,
     type CanActivate,
     type ExecutionContext,
   } from '@nestjs/common';
   import { Reflector } from '@nestjs/core';
   import { JwtService } from '@nestjs/jwt';
   import type { Request } from 'express';

   import { IS_PUBLIC } from './decorators.js';

   export interface Claims {
     readonly sub: string;
     readonly exp: number;
   }

   export type AuthenticatedRequest = Request & { user?: Claims };

   /**
    * Registered as APP_GUARD, so it runs for every route in the application,
    * including routes added after this file was written. The only way past it
    * without a token is @Public().
    */
   @Injectable()
   export class JwtAuthGuard implements CanActivate {
     constructor(
       private readonly jwt: JwtService,
       private readonly reflector: Reflector,
     ) {}

     async canActivate(context: ExecutionContext): Promise<boolean> {
       const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC, [
         context.getHandler(),
         context.getClass(),
       ]);
       if (isPublic === true) return true;

       const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
       const [scheme, token] = (request.headers.authorization ?? '').split(' ');
       // 401, not 403: "who are you", not "you may not".
       if (scheme !== 'Bearer' || token === undefined || token === '') {
         throw new UnauthorizedException();
       }

       let payload: Record<string, unknown>;
       try {
         // Algorithms, audience and issuer come from JwtModule's verifyOptions.
         payload = await this.jwt.verifyAsync<Record<string, unknown>>(token);
       } catch {
         // Which check failed is useful to an attacker and to nobody else.
         throw new UnauthorizedException();
       }

       // jsonwebtoken accepts a token with no `exp` as valid forever, and one
       // with no `sub` would give the caller no identity to own anything by.
       if (
         typeof payload.sub !== 'string' ||
         payload.sub === '' ||
         typeof payload.exp !== 'number'
       ) {
         throw new UnauthorizedException();
       }

       request.user = { sub: payload.sub, exp: payload.exp };
       return true;
     }
   }
   ```

   Verify: `test -f src/auth/jwt-auth.guard.ts`

8. Create `src/auth/auth.module.ts` with:

   ```typescript
   import { Module } from '@nestjs/common';
   import { ConfigService } from '@nestjs/config';
   import { APP_GUARD } from '@nestjs/core';
   import { JwtModule } from '@nestjs/jwt';

   import type { Environment } from '../config/environment.js';
   import { JwtAuthGuard } from './jwt-auth.guard.js';

   @Module({
     imports: [
       JwtModule.registerAsync({
         inject: [ConfigService],
         useFactory: (config: ConfigService<Environment, true>) => ({
           secret: config.get('JWT_SECRET', { infer: true }),
           // Every option is load bearing. `algorithms` stops a token signed
           // another way being accepted (algorithm confusion). `audience` stops
           // a token minted for another service working here. `issuer` stops a
           // token from another issuer sharing the secret.
           verifyOptions: {
             algorithms: ['HS256'],
             audience: config.get('JWT_AUDIENCE', { infer: true }),
             issuer: config.get('JWT_ISSUER', { infer: true }),
           },
         }),
       }),
     ],
     providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
   })
   export class AuthModule {}
   ```

   Verify: `test -f src/auth/auth.module.ts`

9. Create `src/problem/problem-details.filter.ts` with:

   ```typescript
   import { STATUS_CODES } from 'node:http';

   import {
     Catch,
     HttpException,
     Logger,
     type ArgumentsHost,
     type ExceptionFilter,
   } from '@nestjs/common';
   import type { Request, Response } from 'express';

   /** RFC 9457 problem details, the one error shape every route answers with. */
   export interface Problem {
     type: string;
     title: string;
     status: number;
     detail?: string;
     instance: string;
     errors?: string[];
   }

   /**
    * Registered as APP_FILTER, so it catches everything, including errors that
    * are not HttpExceptions. Those become a 500 whose body says nothing about
    * the cause: the stack goes to the log, never to the caller.
    */
   @Catch()
   export class ProblemDetailsFilter implements ExceptionFilter {
     private readonly logger = new Logger(ProblemDetailsFilter.name);

     catch(exception: unknown, host: ArgumentsHost): void {
       const http = host.switchToHttp();
       const request = http.getRequest<Request>();
       const response = http.getResponse<Response>();

       const status = exception instanceof HttpException ? exception.getStatus() : 500;
       const problem: Problem = {
         type: 'about:blank',
         title: STATUS_CODES[status] ?? 'Error',
         status,
         instance: request.originalUrl,
       };

       if (status >= 500) {
         this.logger.error(
           exception instanceof Error ? (exception.stack ?? exception.message) : exception,
         );
       } else if (exception instanceof HttpException) {
         const body = exception.getResponse();
         const message =
           typeof body === 'object' && body !== null && 'message' in body ? body.message : body;
         if (Array.isArray(message)) problem.errors = message.map(String);
         else problem.detail = String(message);
       }

       response.status(status).type('application/problem+json').json(problem);
     }
   }
   ```

   Verify: `test -f src/problem/problem-details.filter.ts`

10. Create `src/health/health.controller.ts` with:

    ```typescript
    import { Controller, Get } from '@nestjs/common';

    import { Public } from '../auth/decorators.js';

    @Controller('health')
    export class HealthController {
      // Liveness only: no token, no database. If this touched Postgres, one
      // database blip would restart every healthy container and turn a
      // degradation into an outage.
      @Public()
      @Get()
      check(): { status: 'ok' } {
        return { status: 'ok' };
      }
    }
    ```

    Verify: `test -f src/health/health.controller.ts`

11. Create `src/items/item.entity.ts` with:

    ```typescript
    import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

    // Constraint and index names are written out, so the migration that creates
    // them is readable and a schema check has nothing generated to disagree with.
    @Entity({ name: 'items' })
    export class Item {
      @PrimaryColumn('uuid', { primaryKeyConstraintName: 'PK_items' })
      id!: string;

      // The verified `sub` claim of whoever created it. Every query filters on it.
      @Index('IDX_items_owner_id')
      @Column({ name: 'owner_id', type: 'varchar', length: 255 })
      ownerId!: string;

      @Column({ type: 'varchar', length: 200 })
      name!: string;

      @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
      createdAt!: Date;
    }
    ```

    Verify: `test -f src/items/item.entity.ts`

12. Create `src/items/item.dto.ts` with:

    ```typescript
    import { ApiProperty } from '@nestjs/swagger';
    import { IsString, Length } from 'class-validator';

    import type { Item } from './item.entity.js';

    /**
     * What a caller may send. The global ValidationPipe strips nothing silently:
     * a property not declared here is a 400, so a client that sends `ownerId`
     * learns it cannot choose one.
     */
    export class CreateItemDto {
      @ApiProperty({ minLength: 1, maxLength: 200 })
      @IsString()
      @Length(1, 200)
      name!: string;
    }

    /** What a caller gets back. The entity itself never leaves the service. */
    export class ItemDto {
      @ApiProperty({ format: 'uuid' })
      id!: string;

      @ApiProperty()
      name!: string;

      @ApiProperty({ type: String, format: 'date-time' })
      createdAt!: string;

      static from(item: Item): ItemDto {
        return { id: item.id, name: item.name, createdAt: item.createdAt.toISOString() };
      }
    }
    ```

    Verify: `test -f src/items/item.dto.ts`

13. Create `src/items/items.service.ts` with:

    ```typescript
    import { randomUUID } from 'node:crypto';

    import { Injectable, NotFoundException } from '@nestjs/common';
    import { InjectRepository } from '@nestjs/typeorm';
    import { Repository } from 'typeorm';

    import { Item } from './item.entity.js';

    /** A page is bounded, so one request cannot ask for the whole table. */
    const PAGE_SIZE = 100;

    @Injectable()
    export class ItemsService {
      constructor(@InjectRepository(Item) private readonly items: Repository<Item>) {}

      // The owner is a parameter of every method, not something a caller may
      // omit. A query without it is how one user reads another's data.
      list(ownerId: string): Promise<Item[]> {
        return this.items.find({
          where: { ownerId },
          order: { createdAt: 'ASC' },
          take: PAGE_SIZE,
        });
      }

      async get(ownerId: string, id: string): Promise<Item> {
        const item = await this.items.findOneBy({ id, ownerId });
        // 404 for somebody else's item as well as a missing one: a 403 would
        // confirm that the id exists.
        if (item === null) throw new NotFoundException();
        return item;
      }

      create(ownerId: string, name: string): Promise<Item> {
        return this.items.save(this.items.create({ id: randomUUID(), ownerId, name }));
      }
    }
    ```

    Verify: `test -f src/items/items.service.ts`

14. Create `src/items/items.controller.ts` with:

    ```typescript
    import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
    import {
      ApiBearerAuth,
      ApiCreatedResponse,
      ApiNotFoundResponse,
      ApiOkResponse,
      ApiTags,
      ApiUnauthorizedResponse,
    } from '@nestjs/swagger';

    import { Subject } from '../auth/decorators.js';
    import { CreateItemDto, ItemDto } from './item.dto.js';
    import { ItemsService } from './items.service.js';

    // No guard decorator here, on purpose: the global guard already denies. The
    // test that an unmarked route refuses an anonymous caller is a test of that
    // default, and it fails the day somebody removes it.
    @ApiTags('items')
    @ApiBearerAuth()
    @ApiUnauthorizedResponse({ description: 'No valid bearer token' })
    @Controller('items')
    export class ItemsController {
      constructor(private readonly items: ItemsService) {}

      @Get()
      @ApiOkResponse({ type: [ItemDto] })
      async list(@Subject() owner: string): Promise<ItemDto[]> {
        return (await this.items.list(owner)).map((item) => ItemDto.from(item));
      }

      @Get(':id')
      @ApiOkResponse({ type: ItemDto })
      @ApiNotFoundResponse()
      async get(
        @Subject() owner: string,
        @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
      ): Promise<ItemDto> {
        return ItemDto.from(await this.items.get(owner, id));
      }

      @Post()
      @ApiCreatedResponse({ type: ItemDto })
      async create(@Subject() owner: string, @Body() body: CreateItemDto): Promise<ItemDto> {
        return ItemDto.from(await this.items.create(owner, body.name));
      }
    }
    ```

    Verify: `test -f src/items/items.controller.ts`

15. Create `src/items/items.module.ts` with:

    ```typescript
    import { Module } from '@nestjs/common';
    import { TypeOrmModule } from '@nestjs/typeorm';

    import { Item } from './item.entity.js';
    import { ItemsController } from './items.controller.js';
    import { ItemsService } from './items.service.js';

    @Module({
      imports: [TypeOrmModule.forFeature([Item])],
      controllers: [ItemsController],
      providers: [ItemsService],
    })
    export class ItemsModule {}
    ```

    Verify: `test -f src/items/items.module.ts`

16. Create the first migration, written out rather than generated so the recipe does not need a database to produce it, `src/database/migrations/1790208000000-create-items.ts` with:

    ```typescript
    import type { MigrationInterface, QueryRunner } from 'typeorm';

    export class CreateItems1790208000000 implements MigrationInterface {
      name = 'CreateItems1790208000000';

      async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          `CREATE TABLE "items" ("id" uuid NOT NULL, "owner_id" character varying(255) NOT NULL, "name" character varying(200) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_items" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_items_owner_id" ON "items" ("owner_id")`);
      }

      async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_items_owner_id"`);
        await queryRunner.query(`DROP TABLE "items"`);
      }
    }
    ```

    Verify: `test -f src/database/migrations/1790208000000-create-items.ts`

17. Create `src/database/options.ts` with:

    ```typescript
    import type { DataSourceOptions } from 'typeorm';

    import { Item } from '../items/item.entity.js';
    import { CreateItems1790208000000 } from './migrations/1790208000000-create-items.js';

    /**
     * One definition of the database, used by the application and by the
     * migration CLI, so the two cannot drift. Entities and migrations are listed
     * as classes rather than globs: a glob that matches `.ts` in development and
     * `.js` in the image is the classic way to ship an image with no migrations.
     */
    export function dataSourceOptions(url: string): DataSourceOptions {
      return {
        type: 'postgres',
        url,
        entities: [Item],
        migrations: [CreateItems1790208000000],
        migrationsTableName: 'migrations',
        // Never. The schema changes through a migration somebody reviewed, and a
        // test proves the migrations and the entities agree.
        synchronize: false,
        migrationsRun: false,
      };
    }
    ```

    Verify: `test -f src/database/options.ts`

18. Create the migration CLI's entry point, `src/database/data-source.ts`, with:

    ```typescript
    import 'reflect-metadata';

    import { DataSource } from 'typeorm';

    import { dataSourceOptions } from './options.js';

    // The migration CLI's entry point. It reads DATABASE_URL and nothing else,
    // and refuses to guess one.
    const url = process.env.DATABASE_URL;
    if (url === undefined || url === '') {
      throw new Error('DATABASE_URL is required');
    }

    export default new DataSource(dataSourceOptions(url));
    ```

    Verify: `test -f src/database/data-source.ts`

19. Create `src/app.module.ts` with:

    ```typescript
    import { Module, ValidationPipe } from '@nestjs/common';
    import { ConfigModule, ConfigService } from '@nestjs/config';
    import { APP_FILTER, APP_PIPE } from '@nestjs/core';
    import { TypeOrmModule } from '@nestjs/typeorm';

    import { AuthModule } from './auth/auth.module.js';
    import { validateEnvironment, type Environment } from './config/environment.js';
    import { dataSourceOptions } from './database/options.js';
    import { HealthController } from './health/health.controller.js';
    import { ItemsModule } from './items/items.module.js';
    import { ProblemDetailsFilter } from './problem/problem-details.filter.js';

    @Module({
      imports: [
        // The environment only: no .env file is read, so what runs in a container
        // is what was configured for it (Twelve-Factor III).
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          validate: validateEnvironment,
        }),
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService<Environment, true>) => ({
            ...dataSourceOptions(config.get('DATABASE_URL', { infer: true })),
            retryAttempts: 5,
            retryDelay: 1000,
          }),
        }),
        AuthModule,
        ItemsModule,
      ],
      controllers: [HealthController],
      providers: [
        // Providers rather than app.useGlobal*() in main.ts, so the tests that
        // import AppModule get exactly the pipeline production gets.
        {
          provide: APP_PIPE,
          useValue: new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
          }),
        },
        { provide: APP_FILTER, useClass: ProblemDetailsFilter },
      ],
    })
    export class AppModule {}
    ```

    Verify: `test -f src/app.module.ts`

20. Create `src/openapi.ts` with:

    ```typescript
    import type { INestApplication } from '@nestjs/common';
    import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

    export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
      const config = new DocumentBuilder()
        .setTitle('api')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build();
      return SwaggerModule.createDocument(app, config);
    }

    /**
     * The UI at /docs and the document at /docs-json. Both are registered on the
     * HTTP adapter directly, outside the guard, which is why main.ts serves them
     * only when API_DOCS=enabled.
     */
    export function serveOpenApi(app: INestApplication): void {
      SwaggerModule.setup('docs', app, () => buildOpenApiDocument(app));
    }
    ```

    Verify: `test -f src/openapi.ts`

21. Create `src/main.ts` with:

    ```typescript
    import 'reflect-metadata';

    import { ConfigService } from '@nestjs/config';
    import { NestFactory } from '@nestjs/core';
    import type { NestExpressApplication } from '@nestjs/platform-express';

    import { AppModule } from './app.module.js';
    import type { Environment } from './config/environment.js';
    import { serveOpenApi } from './openapi.js';

    // Configuration is validated while AppModule is being built, so a missing
    // secret stops the process here, before anything listens. Checked per
    // request instead, the service would answer 500 to everything while /health
    // returned 200 and an orchestrator called it ready.
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const config = app.get<ConfigService<Environment, true>>(ConfigService);

    app.disable('x-powered-by');
    // SIGTERM closes the HTTP server and the connection pool instead of cutting
    // requests off mid-transaction.
    app.enableShutdownHooks();

    if (config.get('API_DOCS', { infer: true }) === 'enabled') {
      serveOpenApi(app);
    }

    await app.listen(config.get('PORT', { infer: true }), '0.0.0.0');
    ```

    Verify: `test -f src/main.ts`

22. Create `test/app.e2e.test.ts` with:

    ```typescript
    import 'reflect-metadata';

    import assert from 'node:assert/strict';
    import { after, before, describe, it } from 'node:test';

    import { Controller, Get, type INestApplication, type Type } from '@nestjs/common';
    import { DiscoveryModule, DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
    import { JwtService } from '@nestjs/jwt';
    import { Test } from '@nestjs/testing';
    import request from 'supertest';
    import { DataSource } from 'typeorm';

    import { IS_PUBLIC } from '../src/auth/decorators.js';
    import { validateEnvironment } from '../src/config/environment.js';
    import { buildOpenApiDocument } from '../src/openapi.js';

    // The tests bring their own token settings, obviously not real. The database
    // is the one thing they take from outside: a Postgres the migrations have
    // already been applied to, named by DATABASE_URL.
    const secret = 'local-development-only-not-a-real-secret';
    process.env.JWT_SECRET = secret;
    process.env.JWT_AUDIENCE = 'api-tests';
    process.env.JWT_ISSUER = 'api-tests';
    process.env.API_DOCS = 'disabled';
    assert.ok(
      process.env.DATABASE_URL,
      'DATABASE_URL must name a migrated Postgres; see README.md',
    );

    // Imported after the environment is set: ConfigModule validates it while the
    // module is being defined.
    const { AppModule } = await import('../src/app.module.js');

    // A route declared the way somebody would add one tomorrow: no decorator, no
    // thought about authentication. It must be refused all the same.
    @Controller('probe')
    class ProbeController {
      @Get()
      get(): string {
        return 'reachable';
      }
    }

    const signer = (key: string, audience = 'api-tests') =>
      new JwtService({
        secret: key,
        signOptions: { algorithm: 'HS256', audience, issuer: 'api-tests', expiresIn: '5m' },
      });

    const tokenFor = (sub: string): string => signer(secret).sign({ sub });

    describe('api', () => {
      let app: INestApplication;

      before(async () => {
        const moduleRef = await Test.createTestingModule({
          imports: [AppModule, DiscoveryModule],
          controllers: [ProbeController],
        }).compile();
        app = moduleRef.createNestApplication();
        await app.init();
      });

      after(async () => {
        await app.close();
      });

      describe('authentication', () => {
        it('health answers without a token', async () => {
          await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' });
        });

        it('a request with no token is refused as a problem document', async () => {
          const response = await request(app.getHttpServer()).get('/items').expect(401);
          assert.match(response.headers['content-type'] ?? '', /^application\/problem\+json/);
          assert.equal(response.body.status, 401);
          assert.equal(response.body.instance, '/items');
        });

        it('a route with no decorator at all is refused: the guard is global', async () => {
          await request(app.getHttpServer()).get('/probe').expect(401);
        });

        it('a token signed with another secret is refused', async () => {
          const forged = signer('a-different-secret-entirely-000000000').sign({ sub: 'user-a' });
          await request(app.getHttpServer())
            .get('/items')
            .auth(forged, { type: 'bearer' })
            .expect(401);
        });

        it('a token minted for another audience is refused', async () => {
          const elsewhere = signer(secret, 'another-service').sign({ sub: 'user-a' });
          await request(app.getHttpServer())
            .get('/items')
            .auth(elsewhere, { type: 'bearer' })
            .expect(401);
        });

        it('a token with no expiry is refused', async () => {
          const forever = new JwtService({
            secret,
            signOptions: { algorithm: 'HS256', audience: 'api-tests', issuer: 'api-tests' },
          }).sign({ sub: 'user-a' });
          await request(app.getHttpServer())
            .get('/items')
            .auth(forever, { type: 'bearer' })
            .expect(401);
        });

        it('the only public handler is the health check', () => {
          const discovery = app.get(DiscoveryService);
          const scanner = app.get(MetadataScanner);
          const reflector = app.get(Reflector);

          const open: string[] = [];
          const controllers = discovery.getControllers();
          // A loop over nothing asserts nothing.
          assert.ok(controllers.length > 0, 'no controllers were discovered');
          for (const wrapper of controllers) {
            const prototype = Object.getPrototypeOf(wrapper.instance) as Record<string, unknown>;
            const classIsPublic = reflector.get<boolean | undefined>(
              IS_PUBLIC,
              wrapper.metatype as Type,
            );
            for (const method of scanner.getAllMethodNames(prototype)) {
              const handler = prototype[method] as (...args: unknown[]) => unknown;
              if (
                classIsPublic === true ||
                reflector.get<boolean | undefined>(IS_PUBLIC, handler) === true
              ) {
                open.push(`${wrapper.name}.${method}`);
              }
            }
          }
          assert.deepEqual(open, ['HealthController.check']);
        });
      });

      describe('validation', () => {
        it('a property the DTO does not declare is a 400, not silently dropped', async () => {
          const response = await request(app.getHttpServer())
            .post('/items')
            .auth(tokenFor('user-a'), { type: 'bearer' })
            .send({ name: 'first', ownerId: 'user-b' })
            .expect(400);
          assert.match(response.headers['content-type'] ?? '', /^application\/problem\+json/);
          assert.ok(Array.isArray(response.body.errors) && response.body.errors.length > 0);
        });

        it('an empty name is a 400', async () => {
          await request(app.getHttpServer())
            .post('/items')
            .auth(tokenFor('user-a'), { type: 'bearer' })
            .send({ name: '' })
            .expect(400);
        });

        it('an id that is not a UUID is a 400 before it reaches the database', async () => {
          await request(app.getHttpServer())
            .get('/items/not-a-uuid')
            .auth(tokenFor('user-a'), { type: 'bearer' })
            .expect(400);
        });
      });

      describe('items', () => {
        it('an item belongs to the caller who created it, and nobody else can read it', async () => {
          const owner = `owner-${crypto.randomUUID()}`;
          const stranger = `stranger-${crypto.randomUUID()}`;

          const created = await request(app.getHttpServer())
            .post('/items')
            .auth(tokenFor(owner), { type: 'bearer' })
            .send({ name: 'first' })
            .expect(201);
          assert.equal(created.body.name, 'first');
          assert.equal(created.body.ownerId, undefined, 'the entity leaked through the response');

          const mine = await request(app.getHttpServer())
            .get('/items')
            .auth(tokenFor(owner), { type: 'bearer' })
            .expect(200);
          assert.deepEqual(
            mine.body.map((item: { id: string }) => item.id),
            [created.body.id],
          );

          const theirs = await request(app.getHttpServer())
            .get('/items')
            .auth(tokenFor(stranger), { type: 'bearer' })
            .expect(200);
          assert.deepEqual(theirs.body, []);

          // 404, not 403: the stranger does not learn that the id exists.
          await request(app.getHttpServer())
            .get(`/items/${created.body.id}`)
            .auth(tokenFor(stranger), { type: 'bearer' })
            .expect(404);
        });
      });

      describe('database', () => {
        it('the applied migrations produce exactly the schema the entities describe', async () => {
          const dataSource = app.get(DataSource);
          assert.equal(dataSource.options.synchronize, false);
          assert.deepEqual(await dataSource.showMigrations(), false, 'a migration is pending');

          const pending = await dataSource.driver.createSchemaBuilder().log();
          assert.deepEqual(
            pending.upQueries.map((query) => query.query),
            [],
            'the entities and the migrations disagree; generate a migration',
          );
        });
      });

      describe('openapi', () => {
        it('documents the bearer scheme and the item routes', () => {
          const document = buildOpenApiDocument(app);
          assert.ok(document.components?.securitySchemes?.bearer, 'no bearer security scheme');
          assert.ok(document.paths['/items']?.post, 'POST /items is not documented');
          assert.ok(document.paths['/items/{id}']?.get, 'GET /items/{id} is not documented');
        });
      });
    });

    describe('configuration', () => {
      const valid = {
        DATABASE_URL: 'postgres://app:local-development-only@127.0.0.1:5432/app',
        JWT_SECRET: secret,
        JWT_AUDIENCE: 'api',
        JWT_ISSUER: 'api',
      };

      it('refuses to start with nothing configured, and names what is missing', () => {
        assert.throws(
          () => validateEnvironment({}),
          /DATABASE_URL.*JWT_SECRET.*JWT_AUDIENCE.*JWT_ISSUER/,
        );
      });

      it('refuses a secret too short for HS256, without repeating it', () => {
        assert.throws(
          () => validateEnvironment({ ...valid, JWT_SECRET: 'short-secret-value' }),
          (error: Error) =>
            error.message.includes('JWT_SECRET') && !error.message.includes('short-secret-value'),
        );
      });

      it('keeps the API documentation off unless it is asked for', () => {
        assert.equal(validateEnvironment(valid).API_DOCS, 'disabled');
      });

      it('reads the port as a number, and refuses one that is not a port', () => {
        assert.equal(validateEnvironment(valid).PORT, 3000);
        assert.equal(validateEnvironment({ ...valid, PORT: '8080' }).PORT, 8080);
        assert.throws(() => validateEnvironment({ ...valid, PORT: 'eighty' }), /PORT/);
      });
    });
    ```

    Verify: `test -f test/app.e2e.test.ts`

23. Create `.gitignore` with:

    ```text
    node_modules/
    dist/
    *.tsbuildinfo
    .env
    .env.*
    # Written by the setup recipe's checks; nothing in them belongs in history.
    db.url
    db.network
    service.url
    check-*
    ```

    Verify: `test -f .gitignore`

24. Create `compose.yaml` with:

    ```yaml
    # Local development only: the database the API and its tests talk to. The
    # password is not a secret because nothing outside this machine can reach it.
    services:
      db:
        image: postgres:18.6-alpine3.24
        environment:
          POSTGRES_USER: app
          POSTGRES_PASSWORD: local-development-only
          POSTGRES_DB: app
        # Loopback, and no fixed host port. Loopback because a database on 0.0.0.0
        # is reachable from whatever network the laptop is on. No fixed port
        # because 5432 is usually taken already; ask Docker which one it chose:
        # `docker compose port db 5432`.
        ports: ['127.0.0.1::5432']
        healthcheck:
          test: ['CMD-SHELL', 'pg_isready -U app -d app']
          interval: 2s
          retries: 15
    ```

    Verify: `test -f compose.yaml`

25. Create `Dockerfile` with:

    ```dockerfile
    FROM node:22.23.3-alpine3.24 AS build
    WORKDIR /src
    # The lockfile, not a fresh resolution: `npm ci` installs exactly what the
    # tests ran against, and refuses when package.json and the lock disagree.
    COPY package.json package-lock.json ./
    RUN npm ci --no-audit --no-fund
    COPY tsconfig.json tsconfig.build.json ./
    COPY src ./src
    # Build, then drop the development dependencies from the tree that is copied
    # forward: TypeScript and the test tools have no business in a running image.
    RUN npm run build && npm prune --omit=dev

    FROM node:22.23.3-alpine3.24
    ENV NODE_ENV=production
    WORKDIR /app
    COPY --from=build /src/package.json ./package.json
    COPY --from=build /src/node_modules ./node_modules
    COPY --from=build /src/dist ./dist
    # The node image ships a non-root user. Nothing here needs root, so nothing
    # runs as root.
    USER node
    EXPOSE 3000
    HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD wget -q -O /dev/null "http://127.0.0.1:${PORT:-3000}/health" || exit 1
    CMD ["node", "dist/src/main.js"]
    ```

    Verify: `test -f Dockerfile`

26. Create `.dockerignore` with:

    ```text
    node_modules
    dist
    test
    .git
    .github
    *.url
    *.log
    .env*
    ```

    Verify: `test -f .dockerignore`

27. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
        branches: [main]
      pull_request:

    permissions:
      contents: read

    jobs:
      test:
        runs-on: ubuntu-latest
        services:
          db:
            image: postgres:18.6-alpine3.24
            env:
              POSTGRES_USER: app
              POSTGRES_PASSWORD: local-development-only
              POSTGRES_DB: app
            ports: ['5432:5432']
            options: >-
              --health-cmd "pg_isready -U app -d app"
              --health-interval 2s
              --health-retries 15
        env:
          DATABASE_URL: postgres://app:local-development-only@127.0.0.1:5432/app
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
          - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
            with:
              node-version: '22'
          - run: npm ci --no-audit --no-fund
          - run: npm run build
          - run: npm run migration:run
          # Fails when an entity changed and nobody generated the migration for it.
          - run: npm run migration:check
          - run: npm test
          - run: docker build --tag api:ci .
    ```

    Verify: `test -f .github/workflows/ci.yml`

28. Create `README.md` with:

    ```markdown
    # api

    A NestJS HTTP API on Postgres, with a global bearer token guard, validated
    input, RFC 9457 error bodies and migrations.

    ## Run it locally

    1. `docker compose up -d --wait` starts Postgres on a port Docker chooses.
       `docker compose port db 5432` says which.
    2. Export `DATABASE_URL` (`postgres://app:local-development-only@<that address>/app`),
       `JWT_SECRET` (32 characters or more), `JWT_AUDIENCE` and `JWT_ISSUER`.
    3. `npm run build`, then `npm run migration:run`, then `npm start`.

    It refuses to start without any of the four, and says which one is missing.
    Set `API_DOCS=enabled` to serve the OpenAPI UI at `/docs` and the document at
    `/docs-json`; it is off by default because it is served outside the guard.

    ## Test it

    `npm test` needs `DATABASE_URL` to name a migrated database. It sets its own
    token settings.

    ## Change the schema

    Edit the entity, `npm run build`, then
    `npm run migration:generate -- src/database/migrations/<Name>`. Read the SQL,
    add the class to the list in `src/database/options.ts`, and commit both.
    `npm run migration:check` fails while an entity and the migrations disagree.

    ## Migrate a deployment

    The image carries the migration command, so a one-off container runs it
    before the new version starts: the image's own `npm run migration:run`, with
    `DATABASE_URL` set. The service never migrates on startup.
    ```

    Verify: `test -f README.md`

29. Build the service: `npm run build`
    Verify: `test -f dist/src/main.js`

30. Remove a database left behind by an earlier attempt, so this does not depend on a clean machine: `docker compose down -v > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker compose ps -q db)"`

31. Start Postgres and wait until it accepts connections: `docker compose up -d --wait`
    Verify: `test -n "$(docker compose ps -q db)"`

32. Ask Docker which host port it chose, and write the connection string once so every step below uses the same one: `echo "postgres://app:local-development-only@$(docker compose port db 5432)/app" > db.url`
    Verify: `grep -q "^postgres://app:local-development-only@127.0.0.1:[0-9]*/app$" db.url`

33. Apply the migrations: `DATABASE_URL="$(cat db.url)" npm run migration:run`
    Verify: `DATABASE_URL="$(cat db.url)" npm run migration:check`

34. Run the end-to-end tests against the migrated database. They prove the claims this blueprint makes: an unauthenticated request is refused, a route with no decorator is refused, only the health check is public, a forged, expiry-less or wrong-audience token is refused, unknown properties are rejected, one caller cannot read another's items, and the migrations match the entities: `DATABASE_URL="$(cat db.url)" npm test`
    Verify: `DATABASE_URL="$(cat db.url)" node --test --test-concurrency=1 "dist/test/**/*.test.js"`

35. Build the container image: `docker build -t nestjs-api:dev .`
    Verify: `docker image inspect nestjs-api:dev > /dev/null`

36. Record the user the image runs as: `docker image inspect --format "{{.Config.User}}" nestjs-api:dev > check-image.user`
    Verify: `grep -qx node check-image.user`

37. Remove check containers left behind by an earlier attempt: `docker rm --force nestjs-api-migrate nestjs-api-unconfigured nestjs-api-check > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker ps -aq --filter name=nestjs-api-migrate --filter name=nestjs-api-unconfigured --filter name=nestjs-api-check)"`

38. Find the network Compose put the database on, so a container can reach it by the name `db`: `docker inspect --format '{{range $name, $settings := .NetworkSettings.Networks}}{{$name}}{{end}}' "$(docker compose ps -q db)" > db.network`
    Verify: `test -s db.network`

39. Run the migrations from the image, the way a deployment runs them: a one-off container before the service starts. They are already applied, so this proves the image carries its migrations rather than changing anything: `docker run -d --name nestjs-api-migrate --network "$(cat db.network)" -e DATABASE_URL="postgres://app:local-development-only@db:5432/app" nestjs-api:dev npm run migration:run`
    Verify: `test "$(timeout 120 docker wait nestjs-api-migrate)" = "0"`

40. Remove the migration container: `docker rm nestjs-api-migrate`
    Verify: `test -z "$(docker ps -aq --filter name=nestjs-api-migrate)"`

41. Start the image with no configuration at all. It must refuse to start rather than listen without a secret: `docker run -d --name nestjs-api-unconfigured nestjs-api:dev`
    Verify: `test "$(timeout 60 docker wait nestjs-api-unconfigured)" = "1"`

42. Keep what it said when it refused: `docker logs nestjs-api-unconfigured > check-unconfigured.log 2>&1`
    Verify: `grep -q "invalid or missing configuration: DATABASE_URL, JWT_SECRET, JWT_AUDIENCE, JWT_ISSUER" check-unconfigured.log`

43. Remove the refused container: `docker rm nestjs-api-unconfigured`
    Verify: `test -z "$(docker ps -aq --filter name=nestjs-api-unconfigured)"`

44. Start the service with its configuration, on the database's network, with the API documentation switched on so it can be checked: `docker run -d --name nestjs-api-check --network "$(cat db.network)" -e DATABASE_URL="postgres://app:local-development-only@db:5432/app" -e JWT_SECRET="local-development-only-not-a-real-secret" -e JWT_AUDIENCE="api" -e JWT_ISSUER="api" -e API_DOCS="enabled" -p 127.0.0.1::3000 nestjs-api:dev`
    Verify: `test -n "$(docker ps -q --filter name=nestjs-api-check)"`

45. Read the port the operating system chose: `docker port nestjs-api-check 3000 | head -1 > service.url`
    Verify: `test -s service.url`

46. Confirm the service answers. The retry is not politeness: the published port accepts connections before the application has connected to Postgres and started listening: `curl -fsS --retry 30 --retry-all-errors --retry-delay 1 -o check-health.json "http://$(cat service.url)/health"`
    Verify: `grep -q '"status":"ok"' check-health.json`

47. Confirm the running image refuses a request with no token, with a problem document: `curl -sS -o check-refused.json -w "%{http_code}" "http://$(cat service.url)/items" > check-refused.code`
    Verify: `grep -q '^401$' check-refused.code && grep -q '"status":401' check-refused.json`

48. Fetch the OpenAPI document the running service publishes: `curl -fsS -o check-openapi.json "http://$(cat service.url)/docs-json"`
    Verify: `grep -q '"/items/{id}"' check-openapi.json`

49. Stop the check container: `docker rm --force nestjs-api-check`
    Verify: `test -z "$(docker ps -aq --filter name=nestjs-api-check)"`

50. Stop the database and remove its volume: `docker compose down -v`
    Verify: `test -z "$(docker compose ps -q db)"`

## After setup

- `docker compose up -d --wait` starts the database again; `README.md` in the
  project says how to run the service against it.
- The service refuses to start without `DATABASE_URL`, `JWT_SECRET`,
  `JWT_AUDIENCE` and `JWT_ISSUER`. They belong in the environment of whatever
  runs it, never in a committed file.
- A schema change is an entity change plus a generated migration, listed in
  `src/database/options.ts`. `npm run migration:check` fails until both exist.
