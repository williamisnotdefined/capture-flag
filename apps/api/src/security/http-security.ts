import type { INestApplication } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import helmet from "helmet";

type TrustProxyValue = boolean | number | string;

const localClientOrigin = "http://localhost:5173";
const trueValues = new Set(["1", "true", "yes", "on"]);
const falseValues = new Set(["0", "false", "no", "off"]);

export function applyHttpSecurity(app: INestApplication) {
  const requireHttps = shouldRequireHttps();
  const expressApp = app.getHttpAdapter().getInstance() as {
    set?: (key: string, value: unknown) => void;
  };

  expressApp.set?.("trust proxy", trustProxyValue());
  app.use(
    helmet({
      contentSecurityPolicy: false,
      hsts: requireHttps ? { includeSubDomains: true, maxAge: 15_552_000 } : false,
    }),
  );

  if (requireHttps) {
    app.use(requireHttpsMiddleware);
  }

  app.enableCors({
    credentials: true,
    origin: corsOrigins(),
  });
}

export function corsOrigins(env: NodeJS.ProcessEnv = process.env) {
  const configuredOrigins = firstConfiguredValue(
    env.CORS_ORIGINS,
    env.CORS_ORIGIN,
    env.CLIENT_BASE_URL,
  );
  if (configuredOrigins) {
    const origins = configuredOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    if (origins.length > 0) {
      return origins;
    }
  }

  if (env.NODE_ENV === "production") {
    throw new Error("CORS_ORIGINS or CORS_ORIGIN must be configured in production");
  }

  return [localClientOrigin];
}

export function shouldRequireHttps(env: NodeJS.ProcessEnv = process.env) {
  const explicitValue = booleanEnvValue(env.REQUIRE_HTTPS, "REQUIRE_HTTPS");
  if (env.NODE_ENV === "production") {
    return true;
  }

  return explicitValue ?? false;
}

export function trustProxyValue(env: NodeJS.ProcessEnv = process.env): TrustProxyValue {
  const rawValue = firstConfiguredValue(env.API_TRUST_PROXY, env.TRUST_PROXY);
  if (!rawValue) {
    return false;
  }

  const normalizedValue = rawValue.trim().toLowerCase();
  if (trueValues.has(normalizedValue)) {
    return true;
  }

  if (falseValues.has(normalizedValue)) {
    return false;
  }

  const numericValue = Number(rawValue);
  if (Number.isSafeInteger(numericValue) && numericValue >= 0) {
    return numericValue;
  }

  return rawValue;
}

export function isHttpsRequest(request: Request) {
  return request.secure || request.protocol === "https";
}

export function requireHttpsMiddleware(request: Request, response: Response, next: NextFunction) {
  if (isHttpsRequest(request)) {
    next();
    return;
  }

  response.status(426).json({
    error: "Upgrade Required",
    message: "HTTPS is required",
    statusCode: 426,
  });
}

function firstConfiguredValue(...values: Array<string | undefined>) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim();
}

function booleanEnvValue(value: string | undefined, name: string) {
  if (value === undefined || value.trim() === "") {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();
  if (trueValues.has(normalizedValue)) {
    return true;
  }

  if (falseValues.has(normalizedValue)) {
    return false;
  }

  throw new Error(`${name} must be a boolean value`);
}
