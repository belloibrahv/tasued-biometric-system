import db from '@/lib/db';
import { QRCode } from '@prisma/client';
import { randomUUID } from 'crypto';

export class QrService {
  static async issue(userId: string, opts?: { expiresAt?: Date; code?: string }): Promise<QRCode> {
    const code = opts?.code || `BIOVAULT-${userId.slice(0, 8)}-${Date.now()}`;
    const expiresAt = opts?.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours default

    return db.qRCode.create({
      data: {
        userId,
        code,
        isActive: true,
        expiresAt,
      },
    });
  }

  static async revoke(code: string): Promise<QRCode | null> {
    const qr = await db.qRCode.findUnique({ where: { code } });
    if (!qr) return null;
    return db.qRCode.update({ where: { code }, data: { isActive: false } });
  }

  static async getByCode(code: string): Promise<QRCode | null> {
    return db.qRCode.findUnique({ where: { code } });
  }

  static async listByUser(userId: string): Promise<QRCode[]> {
    return db.qRCode.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  static async getActiveQR(userId: string): Promise<QRCode | null> {
    return db.qRCode.findFirst({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async refreshQR(userId: string): Promise<QRCode> {
    // Deactivate old QR codes
    await db.qRCode.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Create new QR code
    return this.issue(userId);
  }

  static isValid(qr: QRCode | null): boolean {
    if (!qr) return false;
    if (!qr.isActive) return false;
    if (qr.expiresAt && qr.expiresAt < new Date()) return false;
    return true;
  }

  static async recordUsage(qrId: string): Promise<void> {
    await db.qRCode.update({
      where: { id: qrId },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  }
}

export default QrService;
