import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import "reflect-metadata";
import { AppModule } from "./app.module";
import { PrismaExceptionFilter } from "./common/prisma-exception.filter";
import { applyHttpSecurity } from "./security/http-security";

type OpenApiMethod = (typeof openApiMethods)[number];
type OpenApiOperation = {
  description?: string;
  security?: Array<Record<string, string[]>>;
};
type OpenApiPathItem = Partial<Record<OpenApiMethod, OpenApiOperation>>;
type MutableOpenApiDocument = ReturnType<typeof SwaggerModule.createDocument> & {
  paths: Record<string, OpenApiPathItem>;
};

const openApiMethods = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
  "head",
  "trace",
] as const;

const managementApiOpenApiRoutes: Record<
  string,
  Partial<Record<OpenApiMethod, readonly string[]>>
> = {
  "/api/v1/configs/{configId}/segments": {
    get: ["segments:read"],
    post: ["segments:write"],
  },
  "/api/v1/configs/{configId}/segments/{segmentId}": {
    delete: ["segments:write"],
    patch: ["segments:write"],
  },
  "/api/v1/environments": {
    get: ["environments:read"],
  },
  "/api/v1/flags": {
    get: ["flags:read"],
    post: ["flags:write"],
  },
  "/api/v1/flags/{id}": {
    patch: ["flags:write"],
  },
  "/api/v1/organizations/{organizationId}/members": {
    get: ["members:read"],
    post: ["members:write"],
  },
  "/api/v1/projects": {
    get: ["projects:read"],
    post: ["projects:write"],
  },
  "/api/v1/projects/{projectId}/configs": {
    get: ["configs:read"],
    post: ["configs:write"],
  },
  "/api/v1/projects/{projectId}/members": {
    get: ["members:read"],
    post: ["members:write"],
  },
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  applyHttpSecurity(app);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  const openApiConfig = new DocumentBuilder()
    .setTitle("Capture Flag API")
    .setDescription("Capture Flag REST API v1")
    .setVersion("1.0")
    .addBearerAuth({ bearerFormat: "API token", scheme: "bearer", type: "http" }, "api-token")
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);
  restrictOpenApiToManagementApi(openApiDocument);
  SwaggerModule.setup("api/v1/docs", app, openApiDocument, {
    jsonDocumentUrl: "/api/v1/openapi.json",
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();

function restrictOpenApiToManagementApi(document: ReturnType<typeof SwaggerModule.createDocument>) {
  const paths = (document as MutableOpenApiDocument).paths;

  for (const path of Object.keys(paths)) {
    const allowedMethods = managementApiOpenApiRoutes[path];
    const pathItem = paths[path];

    if (!allowedMethods) {
      delete paths[path];
      continue;
    }

    for (const method of openApiMethods) {
      const operation = pathItem[method];
      const requiredScopes = allowedMethods[method];

      if (!operation || !requiredScopes) {
        delete pathItem[method];
        continue;
      }

      operation.security = [{ "api-token": [] }];
      operation.description = appendOpenApiScopeDescription(operation.description, requiredScopes);
    }

    if (!openApiMethods.some((method) => pathItem[method])) {
      delete paths[path];
    }
  }
}

function appendOpenApiScopeDescription(description: string | undefined, scopes: readonly string[]) {
  const scopeDescription = `Required API token scopes: ${scopes.join(", ")}.`;
  return description ? `${description}\n\n${scopeDescription}` : scopeDescription;
}
