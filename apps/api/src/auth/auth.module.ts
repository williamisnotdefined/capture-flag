import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { GithubAuthService } from "./github-auth.service";
import { SessionGuard } from "./session.guard";
import { SessionsService } from "./sessions.service";

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [GithubAuthService, SessionsService, SessionGuard],
  exports: [SessionsService, SessionGuard],
})
export class AuthModule {}
