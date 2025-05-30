import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createConversationSchema = Joi.object({
    languageId: Joi.string().required(),
    typeId: Joi.string().required(),
});

// Get conversation types
router.get('/types', async (req, res, next) => {
    try {
        const types = await prisma.conversationType.findMany({
            where: { isActive: true },
            orderBy: { difficultyLevel: 'asc' },
        });

        res.json({ types });
    } catch (error) {
        next(error);
    }
});

// Create new conversation
router.post('/', authenticateToken, async (req: any, res, next) => {
    try {
        const { error, value } = createConversationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { languageId, typeId } = value;

        // Verify language and type exist
        const language = await prisma.language.findUnique({ where: { id: languageId } });
        const type = await prisma.conversationType.findUnique({ where: { id: typeId } });

        if (!language || !type) {
            return res.status(404).json({ error: 'Language or conversation type not found' });
        }

        const conversation = await prisma.conversation.create({
            data: {
                userId: req.user.id,
                languageId,
                typeId,
            },
            include: {
                language: true,
                type: true,
            },
        });

        res.status(201).json({ conversation });
    } catch (error) {
        next(error);
    }
});

// Get user's conversations
router.get('/', authenticateToken, async (req: any, res, next) => {
    try {
        const conversations = await prisma.conversation.findMany({
            where: { userId: req.user.id },
            include: {
                language: true,
                type: true,
                transcripts: {
                    orderBy: { timestamp: 'asc' },
                },
            },
            orderBy: { startedAt: 'desc' },
        });

        res.json({ conversations });
    } catch (error) {
        next(error);
    }
});

// Get specific conversation
router.get('/:id', authenticateToken, async (req: any, res, next) => {
    try {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id,
            },
            include: {
                language: true,
                type: true,
                transcripts: {
                    orderBy: { timestamp: 'asc' },
                },
            },
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        res.json({ conversation });
    } catch (error) {
        next(error);
    }
});

// End conversation
router.patch('/:id/end', authenticateToken, async (req: any, res, next) => {
    try {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id,
                status: 'ACTIVE',
            },
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Active conversation not found' });
        }

        const endedAt = new Date();
        const durationSeconds = Math.floor(
            (endedAt.getTime() - conversation.startedAt.getTime()) / 1000
        );

        const updatedConversation = await prisma.conversation.update({
            where: { id: req.params.id },
            data: {
                status: 'COMPLETED',
                endedAt,
                durationSeconds,
            },
            include: {
                language: true,
                type: true,
                transcripts: {
                    orderBy: { timestamp: 'asc' },
                },
            },
        });

        // Update user progress
        await prisma.userProgress.upsert({
            where: {
                userId_languageId: {
                    userId: req.user.id,
                    languageId: conversation.languageId,
                },
            },
            update: {
                sessionsCount: { increment: 1 },
                totalDurationMinutes: { increment: Math.ceil(durationSeconds / 60) },
                lastSessionAt: endedAt,
            },
            create: {
                userId: req.user.id,
                languageId: conversation.languageId,
                sessionsCount: 1,
                totalDurationMinutes: Math.ceil(durationSeconds / 60),
                lastSessionAt: endedAt,
            },
        });

        res.json({ conversation: updatedConversation });
    } catch (error) {
        next(error);
    }
});

export default router;
