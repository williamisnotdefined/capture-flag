export type Organization = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

export type Project = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  configs: Config[];
  environments: Environment[];
  currentUserProjectRole?: string | null;
};

export type Config = {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string | null;
};

export type Environment = {
  id: string;
  projectId: string;
  key: string;
  name: string;
  sortOrder: number;
};

export type SdkKey = {
  id: string;
  projectId: string;
  configId: string;
  environmentId: string;
  name: string;
  keyPrefix: string;
  key?: string;
  revokedAt: string | null;
  config: Pick<Config, "id" | "key" | "name">;
  environment: Pick<Environment, "id" | "key" | "name">;
};

export type UserSummary = {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
};

export type OrganizationMember = {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  user: UserSummary;
};

export type ProjectMember = {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  user: UserSummary;
};

export type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string | null;
    avatarUrl: string | null;
  };
  organizations: Organization[];
};
