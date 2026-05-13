import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Response } from "express";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception.code === "P2002") {
      return response.status(HttpStatus.CONFLICT).json({
        message: "Resource already exists",
        statusCode: HttpStatus.CONFLICT,
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Database operation failed",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}
