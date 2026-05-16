import { PrismaClient } from "@prisma/client";
import { assertE2eDatabaseUrl, e2eDatabaseUrl } from "./env";

assertE2eDatabaseUrl();

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: e2eDatabaseUrl,
    },
  },
});

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
