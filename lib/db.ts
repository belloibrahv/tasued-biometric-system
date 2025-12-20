import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaOptions: any = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
};

const client = global.prisma || new PrismaClient(prismaOptions);

if (process.env.NODE_ENV === 'development') {
  global.prisma = client;
}

export default client;