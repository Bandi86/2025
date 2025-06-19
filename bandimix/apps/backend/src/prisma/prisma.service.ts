import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
// This service extends PrismaClient and implements lifecycle hooks to connect and disconnect from the database when the module is initialized and destroyed, respectively. It can be injected into other services or modules to interact with the database using Prisma ORM.
// The PrismaService can be used in other modules, such as the AuthModule or UsersModule, to perform database operations. For example, in the AuthService, you can inject PrismaService to access the database methods provided by PrismaClient, such as finding users by username or email, creating new users, and more. This allows for a clean separation of concerns and makes it easier to manage database interactions throughout your application.