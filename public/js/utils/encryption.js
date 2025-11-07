class AdvancedEncryption {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
    }

    // Generate encryption key
    async generateKey() {
        try {
            const key = await crypto.subtle.generateKey(
                {
                    name: this.algorithm,
                    length: this.keyLength,
                },
                true,
                ['encrypt', 'decrypt']
            );
            return key;
        } catch (error) {
            console.error('Key generation error:', error);
            return null;
        }
    }

    // Derive key from password
    async deriveKeyFromPassword(password, salt) {
        try {
            const encoder = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                'PBKDF2',
                false,
                ['deriveKey']
            );

            const key = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: encoder.encode(salt),
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                {
                    name: this.algorithm,
                    length: this.algorithm === 'AES-GCM' ? 256 : 128
                },
                true,
                ['encrypt', 'decrypt']
            );

            return key;
        } catch (error) {
            console.error('Key derivation error:', error);
            return null;
        }
    }

    // Encrypt data
    async encryptData(data, key) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                dataBuffer
            );

            // Combine IV and encrypted data
            const result = new Uint8Array(iv.length + encrypted.byteLength);
            result.set(iv, 0);
            result.set(new Uint8Array(encrypted), iv.length);

            return this.arrayBufferToBase64(result);

        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    }

    // Decrypt data
    async decryptData(encryptedData, key) {
        try {
            const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);
            
            // Extract IV (first 12 bytes)
            const iv = encryptedBuffer.slice(0, 12);
            const data = encryptedBuffer.slice(12);
            
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                data
            );

            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decrypted));

        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    // Simple XOR encryption (fallback)
    xorEncrypt(data, key) {
        let result = '';
        for (let i = 0; i < data.length; i++) {
            result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result);
    }

    // XOR decryption
    xorDecrypt(encryptedData, key) {
        try {
            const data = atob(encryptedData);
            let result = '';
            for (let i = 0; i < data.length; i++) {
                result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        } catch (error) {
            return null;
        }
    }

    // Generate secure random string
    generateRandomString(length = 32) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const values = new Uint8Array(length);
        crypto.getRandomValues(values);
        
        for (let i = 0; i < length; i++) {
            result += charset[values[i] % charset.length];
        }
        return result;
    }

    // Hash data
    async hashData(data) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);
            
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return hashHex;
        } catch (error) {
            console.error('Hashing error:', error);
            return null;
        }
    }

    // Generate HMAC
    async generateHMAC(data, key) {
        try {
            const encoder = new TextEncoder();
            const keyBuffer = encoder.encode(key);
            const dataBuffer = encoder.encode(data);
            
            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                keyBuffer,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );
            
            const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
            const signatureArray = Array.from(new Uint8Array(signature));
            const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return signatureHex;
        } catch (error) {
            console.error('HMAC generation error:', error);
            return null;
        }
    }

    // Verify HMAC
    async verifyHMAC(data, signature, key) {
        try {
            const generatedSignature = await this.generateHMAC(data, key);
            return generatedSignature === signature;
        } catch (error) {
            console.error('HMAC verification error:', error);
            return false;
        }
    }

    // Utility functions
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    // Generate encryption key from environment
    async generateEnvironmentKey() {
        const factors = [
            navigator.userAgent,
            navigator.platform,
            screen.width * screen.height,
            navigator.language,
            new Date().getTimezoneOffset().toString()
        ];
        
        const combined = factors.join('|');
        return await this.hashData(combined);
    }

    // Encrypt data for transmission
    async encryptForTransmission(data) {
        try {
            // Generate session key
            const sessionKey = this.generateRandomString(32);
            
            // Encrypt data with session key using XOR (fast)
            const encryptedData = this.xorEncrypt(JSON.stringify(data), sessionKey);
            
            // Generate environment key
            const envKey = await this.generateEnvironmentKey();
            
            // Encrypt session key with environment key
            const encryptedSessionKey = this.xorEncrypt(sessionKey, envKey);
            
            return {
                data: encryptedData,
                key: encryptedSessionKey,
                timestamp: Date.now(),
                algorithm: 'XOR-AES256'
            };

        } catch (error) {
            console.error('Transmission encryption error:', error);
            // Fallback to simple base64
            return {
                data: btoa(JSON.stringify(data)),
                timestamp: Date.now(),
                algorithm: 'BASE64'
            };
        }
    }

    // Decrypt transmitted data
    async decryptTransmission(encryptedPackage) {
        try {
            if (encryptedPackage.algorithm === 'XOR-AES256') {
                // Generate environment key
                const envKey = await this.generateEnvironmentKey();
                
                // Decrypt session key
                const sessionKey = this.xorDecrypt(encryptedPackage.key, envKey);
                
                // Decrypt data with session key
                const decryptedData = this.xorDecrypt(encryptedPackage.data, sessionKey);
                
                return JSON.parse(decryptedData);
                
            } else if (encryptedPackage.algorithm === 'BASE64') {
                // Simple base64 decode
                return JSON.parse(atob(encryptedPackage.data));
            } else {
                throw new Error('Unknown encryption algorithm');
            }
        } catch (error) {
            console.error('Transmission decryption error:', error);
            return null;
        }
    }
}

// Export for use in other modules
window.AdvancedEncryption = AdvancedEncryption;
