import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Seed Languages
    console.log('📚 Seeding languages...');
    const languages = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'es', name: 'Spanish', nativeName: 'Español' },
        { code: 'fr', name: 'French', nativeName: 'Français' },
        { code: 'de', name: 'German', nativeName: 'Deutsch' },
        { code: 'it', name: 'Italian', nativeName: 'Italiano' },
        { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語' },
        { code: 'ko', name: 'Korean', nativeName: '한국어' },
        { code: 'zh', name: 'Chinese', nativeName: '中文' },
        { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    ];

    for (const lang of languages) {
        await prisma.language.upsert({
            where: { code: lang.code },
            update: {},
            create: lang,
        });
    }

    // Seed Conversation Types
    console.log('💬 Seeding conversation types...');
    const conversationTypes = [
        {
            name: 'Casual Conversation',
            description: 'Everyday topics like hobbies, weather, family, and daily activities',
            difficultyLevel: 1,
        },
        {
            name: 'Travel Scenarios',
            description: 'Hotel bookings, asking for directions, ordering food, and travel situations',
            difficultyLevel: 2,
        },
        {
            name: 'Business Meeting',
            description: 'Professional discussions, presentations, and workplace conversations',
            difficultyLevel: 3,
        },
        {
            name: 'Academic Discussion',
            description: 'Debates, research topics, and educational conversations',
            difficultyLevel: 4,
        },
        {
            name: 'Job Interview',
            description: 'Interview scenarios, both technical and behavioral questions',
            difficultyLevel: 4,
        },
        {
            name: 'Cultural Exchange',
            description: 'Discussing traditions, customs, lifestyle, and cultural differences',
            difficultyLevel: 2,
        },
    ];

    for (const type of conversationTypes) {
        await prisma.conversationType.upsert({
            where: { name: type.name },
            update: {},
            create: type,
        });
    }

    // Create a demo user for development
    console.log('👤 Creating demo user...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('demo123', 10);

    await prisma.user.upsert({
        where: { email: 'demo@example.com' },
        update: {},
        create: {
            email: 'demo@example.com',
            passwordHash: hashedPassword,
            firstName: 'Demo',
            lastName: 'User',
            nativeLanguage: 'en',
        },
    });

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Languages: ${languages.length}`);
    console.log(`- Conversation Types: ${conversationTypes.length}`);
    console.log('- Demo User: demo@example.com (password: demo123)');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
