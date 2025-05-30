import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get user progress
router.get('/progress', authenticateToken, async (req: any, res, next) => {
    try {
        const progress = await prisma.userProgress.findMany({
            where: { userId: req.user.id },
            include: {
                language: true,
            },
        });

        res.json({ progress });
    } catch (error) {
        next(error);
    }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req: any, res, next) => {
    try {
        const [totalConversations, totalMinutes, languages] = await Promise.all([
            prisma.conversation.count({
                where: { userId: req.user.id, status: 'COMPLETED' },
            }),
            prisma.userProgress.aggregate({
                where: { userId: req.user.id },
                _sum: { totalDurationMinutes: true },
            }),
            prisma.userProgress.count({
                where: { userId: req.user.id },
            }),
        ]);

        res.json({
            stats: {
                totalConversations,
                totalMinutes: totalMinutes._sum.totalDurationMinutes || 0,
                languagesPracticed: languages,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
