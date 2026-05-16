import { BadRequestException, Injectable } from "@nestjs/common";

export type AuditLogCursor = {
  createdAt: string;
  id: string;
};

@Injectable()
export class AuditLogCursorService {
  encode(log: { createdAt: Date; id: string }) {
    return Buffer.from(
      JSON.stringify({
        createdAt: log.createdAt.toISOString(),
        id: log.id,
      } satisfies AuditLogCursor),
      "utf8",
    ).toString("base64url");
  }

  decode(value: string): AuditLogCursor {
    try {
      const parsed = JSON.parse(
        Buffer.from(value, "base64url").toString("utf8"),
      ) as Partial<AuditLogCursor>;

      if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") {
        throw new Error("Invalid audit log cursor");
      }

      const createdAt = new Date(parsed.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        throw new Error("Invalid audit log cursor");
      }

      return { createdAt: createdAt.toISOString(), id: parsed.id };
    } catch {
      throw new BadRequestException("Invalid audit log cursor");
    }
  }
}
