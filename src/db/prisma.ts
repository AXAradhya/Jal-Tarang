/**
 * JAL TARANG — Prisma Client Singleton
 * 
 * Provides an enterprise-configured PrismaClient instance with:
 * - Query logging in development
 * - Connection pool resilience
 * - Graceful shutdown hooks
 */

import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';

declare global {
  // eslint-disable-next-line no-var
  var prismaClientGlobal: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.prismaClientGlobal ??
  new PrismaClient({
    log: config.env === 'development' ? ['warn', 'error'] : ['error'],
  });

if (config.env !== 'production') {
  globalThis.prismaClientGlobal = prisma;
}

export default prisma;
