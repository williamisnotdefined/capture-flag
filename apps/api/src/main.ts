import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import "reflect-metadata";
import { AppModule } from "./app.module";
import { PrismaExceptionFilter } from "./common/prisma-exception.filter";
import { restrictOpenApiToManagementApi } from "./management-api/management-api-openapi";
import { applyHttpSecurity } from "./security/http-security";

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
