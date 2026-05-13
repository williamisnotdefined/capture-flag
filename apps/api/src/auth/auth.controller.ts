import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { PrismaService } from "../prisma/prisma.service";
import { GithubAuthService } from "./github-auth.service";
import { SessionGuard } from "./session.guard";
import { SessionsService } from "./sessions.service";

const oauthStateCookie = "cf_oauth_state";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly github: GithubAuthService,
    private readonly sessions: SessionsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("github/start")
  startGithub(@Res() response: Response) {
    const state = this.github.createState();
    response.cookie(oauthStateCookie, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 10,
    });

    response.redirect(this.github.getAuthorizationUrl(state));
  }

  @Get("github/callback")
  async githubCallback(
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ) {
    const storedState = request.cookies?.[oauthStateCookie];

    if (!code || !state || !storedState || state !== storedState) {
      throw new UnauthorizedException("Invalid OAuth callback");
    }

    const user = await this.github.authenticate(code);
    const session = await this.sessions.createSession(user.id);

    response.clearCookie(oauthStateCookie);
    response.cookie(this.sessions.cookieName, session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: session.maxAgeMs,
    });
    response.redirect(process.env.CLIENT_BASE_URL ?? "http://localhost:5173");
  }

  @Get("me")
  @UseGuards(SessionGuard)
  async me(@Req() request: AuthenticatedRequest) {
    const organizations = await this.prisma.organizationMember.findMany({
      where: {
        userId: request.user.id,
      },
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return {
      user: request.user,
      organizations: organizations.map((membership) => ({
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        role: membership.role,
      })),
    };
  }

  @Post("logout")
  @UseGuards(SessionGuard)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies?.[this.sessions.cookieName];

    if (token) {
      await this.sessions.revokeToken(token);
    }

    response.clearCookie(this.sessions.cookieName);

    return { ok: true };
  }
}
