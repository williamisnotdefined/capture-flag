import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const githubProvider = "github";

export type GithubUserProvisioningInput = {
  providerUserId: string;
  name: string;
  email: string | null;
};

@Injectable()
export class GithubUserProvisioningService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertUser(input: GithubUserProvisioningInput) {
    const email = this.normalizeEmail(input.email);
    const existingAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: githubProvider,
          providerUserId: input.providerUserId,
        },
      },
    });

    if (existingAccount) {
      if (!email) {
        return this.prisma.user.findUniqueOrThrow({ where: { id: existingAccount.userId } });
      }

      return this.prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: existingAccount.userId },
          data: { email },
        });

        await tx.oAuthAccount.update({
          where: { id: existingAccount.id },
          data: { providerEmail: email },
        });

        return user;
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const user = email
        ? await tx.user.upsert({
            where: { email },
            create: {
              name: input.name,
              email,
            },
            update: {
              email,
            },
          })
        : await tx.user.create({
            data: {
              name: input.name,
              email: null,
            },
          });

      await tx.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: githubProvider,
          providerUserId: input.providerUserId,
          providerEmail: email,
        },
      });

      return user;
    });
  }

  private normalizeEmail(email: string | null): string | null {
    const normalized = email?.trim().toLowerCase();
    return normalized || null;
  }
}
