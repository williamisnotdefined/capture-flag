import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AccessService } from "./access.service";

@Module({
  imports: [PrismaModule],
  providers: [AccessService],
  exports: [AccessService, PrismaModule],
})
export class CommonModule {}
