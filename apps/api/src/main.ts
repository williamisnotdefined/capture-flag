import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import "reflect-metadata";
import { AppModule } from "./app.module";
import { PrismaExceptionFilter } from "./common/prisma-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigin =
    process.env.CORS_ORIGIN ?? process.env.CLIENT_BASE_URL ?? "http://localhost:5173";

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
