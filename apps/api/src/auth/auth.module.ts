import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { GithubAuthService } from "./github-auth.service";
import { SessionGuard } from "./session.guard";
import { SessionsService } from "./sessions.service";
import { GetCurrentUserService, LogoutSessionService } from "./use-cases";

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    GithubAuthService,
    SessionsService,
    SessionGuard,
    GetCurrentUserService,
    LogoutSessionService,
  ],
  exports: [SessionsService, SessionGuard],
})
export class AuthModule {}
