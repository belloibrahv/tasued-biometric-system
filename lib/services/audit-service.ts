import db from '@/lib/db';
import { ActorType } from '@prisma/client';

export type AuditInput = {
  userId?: string;
  actorType: ActorType;
  actorId: string;
  actionType: string;
  resourceType: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: string;
  errorMessage?: string;
};

export class AuditService {
  static async log(input: AuditInput) {
    try {
      return await db.auditLog.create({
        data: {
          userId: input.userId || null,
          actorType: input.actorType,
          actorId: input.actorId,
          actionType: input.actionType,
          resourceType: input.resourceType,
          resourceId: input.resourceId || null,
          details: input.details,
          ipAddress: input.ipAddress || null,
          userAgent: input.userAgent || null,
          status: input.status || 'SUCCESS',
          errorMessage: input.errorMessage || null,
        },
      });
    } catch (e) {
      console.error('Audit log failed', e);
    }
  }

  static async listForUser(userId: string, limit = 50, cursor?: string) {
    return db.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
  }

  static async listByActor(actorId: string, limit = 50, cursor?: string) {
    return db.auditLog.findMany({
      where: { actorId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
  }

  static async listByAction(actionType: string, limit = 50) {
    return db.auditLog.findMany({
      where: { actionType },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}

export default AuditService;
