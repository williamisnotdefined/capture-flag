import { Module } from "@nestjs/common";
import { AuthController } from "./auth/auth.controller";
import { GithubAuthService } from "./auth/github-auth.service";
import { SessionGuard } from "./auth/session.guard";
import { SessionsService } from "./auth/sessions.service";
import { AccessService } from "./common/access.service";
import { ConfigsController } from "./configs/configs.controller";
import { ConfigsService } from "./configs/configs.service";
import { EnvironmentsController } from "./environments/environments.controller";
import { EnvironmentsService } from "./environments/environments.service";
import { HealthController } from "./health/health.controller";
import { OrganizationsController } from "./organizations/organizations.controller";
import { OrganizationsService } from "./organizations/organizations.service";
import { PrismaService } from "./prisma/prisma.service";
import { ProjectsController } from "./projects/projects.controller";
import { ProjectsService } from "./projects/projects.service";
import { SdkKeysController } from "./sdk-keys/sdk-keys.controller";
import { SdkKeysService } from "./sdk-keys/sdk-keys.service";

@Module({
  controllers: [
    HealthController,
    AuthController,
    OrganizationsController,
    ProjectsController,
    ConfigsController,
    EnvironmentsController,
    SdkKeysController,
  ],
  providers: [
    PrismaService,
    SessionsService,
    SessionGuard,
    GithubAuthService,
    AccessService,
    OrganizationsService,
    ProjectsService,
    ConfigsService,
    EnvironmentsService,
    SdkKeysService,
  ],
})
export class AppModule {}
