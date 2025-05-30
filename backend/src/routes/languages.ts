import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all active languages
router.get('/', async (req, res, next) => {
    try {
        const languages = await prisma.language.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });

        res.json({ languages });
    } catch (error) {
        next(error);
    }
});

// Get language by code
router.get('/:code', async (req, res, next) => {
    try {
        const language = await prisma.language.findUnique({
            where: { code: req.params.code },
        });

        if (!language) {
            return res.status(404).json({ error: 'Language not found' });
        }

        res.json({ language });
    } catch (error) {
        next(error);
    }
});

export default router;
