import { Controller, Get, Headers, Param, Res } from "@nestjs/common";
import type { Response } from "express";
import { PublicSdkService } from "./public-sdk.service";

@Controller()
export class PublicSdkController {
  constructor(private readonly publicSdk: PublicSdkService) {}

  @Get("public/sdk/:sdkKey/config")
  async getConfig(
    @Param("sdkKey") sdkKey: string,
    @Headers("if-none-match") ifNoneMatch: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.publicSdk.getConfig(sdkKey, ifNoneMatch);

    response.setHeader("ETag", result.etag);
    response.setHeader("Cache-Control", result.cacheControl);

    if (result.notModified) {
      response.status(304);
      return undefined;
    }

    return result.body;
  }
}
