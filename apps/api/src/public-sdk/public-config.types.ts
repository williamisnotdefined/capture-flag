import type { Prisma } from "@prisma/client";

export type PublicConfigFlag = {
  type: string;
  defaultValue: Prisma.JsonValue;
  rules: Prisma.JsonValue[];
  percentageAttribute: string;
  percentageOptions: Prisma.JsonValue[];
};

export type PublicConfigSegment = {
  conditions: Prisma.JsonValue[];
};

export type PublicConfigBody = {
  schemaVersion: 1;
  projectKey: string;
  configKey: string;
  environment: string;
  revision: number;
  generatedAt: string;
  segments: Record<string, PublicConfigSegment>;
  flags: Record<string, PublicConfigFlag>;
};

export type PublicConfigResult =
  | {
      etag: string;
      cacheControl: string;
      notModified: true;
    }
  | {
      etag: string;
      cacheControl: string;
      notModified: false;
      body: PublicConfigBody;
    };

export type PublicConfigPreviewResult = {
  body: PublicConfigBody;
  etag: string;
};

export type PublicConfigBuildInput = {
  configId: string;
  configKey: string;
  environmentId: string;
  environmentKey: string;
  generatedAt: Date;
  projectKey: string;
  revision: number;
};

export type PublicSdkKeyConfig = {
  id: string;
  configId: string;
  environmentId: string;
  revokedAt: Date | null;
  project: {
    id: string;
    slug: string;
  };
  config: {
    id: string;
    key: string;
  };
  environment: {
    id: string;
    key: string;
  };
};
