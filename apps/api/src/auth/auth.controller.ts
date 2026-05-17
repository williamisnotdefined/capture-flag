import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { UpdateCurrentUserDto } from "./dto/auth.dto";
import { GithubAuthService } from "./github-auth.service";
import { SessionGuard } from "./session.guard";
import { SessionsService } from "./sessions.service";
import {
  DeleteCurrentUserService,
  GetCurrentUserService,
  LogoutSessionService,
  UpdateCurrentUserService,
} from "./use-cases";

const oauthStateCookie = "cf_oauth_state";

@Controller("api/v1/auth")
export class AuthController {
  constructor(
    private readonly github: GithubAuthService,
    private readonly sessions: SessionsService,
    private readonly deleteCurrentUser: DeleteCurrentUserService,
    private readonly getCurrentUser: GetCurrentUserService,
    private readonly logoutSession: LogoutSessionService,
    private readonly updateCurrentUser: UpdateCurrentUserService,
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
    response.cookie(
      this.sessions.cookieName,
      session.token,
      this.sessions.cookieOptions(session.maxAgeMs),
    );
    response.redirect(process.env.CLIENT_BASE_URL ?? "http://localhost:5173");
  }

  @Get("me")
  @UseGuards(SessionGuard)
  async me(@Req() request: AuthenticatedRequest) {
    return this.getCurrentUser.execute(request.user);
  }

  @Patch("me")
  @UseGuards(SessionGuard)
  async updateMe(@Req() request: AuthenticatedRequest, @Body() input: UpdateCurrentUserDto) {
    return this.updateCurrentUser.execute({ userId: request.user.id, name: input.name });
  }

  @Delete("me")
  @UseGuards(SessionGuard)
  async deleteMe(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.deleteCurrentUser.execute({ userId: request.user.id });

    response.clearCookie(this.sessions.cookieName, this.sessions.cookieOptions());

    return result;
  }

  @Post("logout")
  @UseGuards(SessionGuard)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies?.[this.sessions.cookieName];
    const result = await this.logoutSession.execute({ token });

    response.clearCookie(this.sessions.cookieName, this.sessions.cookieOptions());

    return result;
  }
}
