import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { GithubAuthService } from "./github-auth.service";
import { GithubOAuthClientService } from "./github-oauth-client.service";
import { GithubOAuthConfigService } from "./github-oauth-config.service";
import { GithubUserProvisioningService } from "./github-user-provisioning.service";
import { SessionGuard } from "./session.guard";
import { SessionsService } from "./sessions.service";
import {
  AuthenticateGithubCodeService,
  DeleteCurrentUserService,
  GetCurrentUserService,
  LogoutSessionService,
  UpdateCurrentUserService,
} from "./use-cases";

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    GithubAuthService,
    GithubOAuthConfigService,
    GithubOAuthClientService,
    GithubUserProvisioningService,
    AuthenticateGithubCodeService,
    DeleteCurrentUserService,
    SessionsService,
    SessionGuard,
    GetCurrentUserService,
    LogoutSessionService,
    UpdateCurrentUserService,
  ],
  exports: [SessionsService, SessionGuard],
})
export class AuthModule {}
