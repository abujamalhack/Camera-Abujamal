class DataCompression {
    constructor() {
        this.compressionMethods = {
            gzip: 'gzip',
            deflate: 'deflate',
            br: 'br'
        };
    }

    // Compress data using various methods
    async compressData(data, method = 'gzip') {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            
            let compressedBuffer;
            
            switch (method) {
                case 'gzip':
                    compressedBuffer = await this.gzipCompress(dataBuffer);
                    break;
                case 'deflate':
                    compressedBuffer = await this.deflateCompress(dataBuffer);
                    break;
                case 'br':
                    compressedBuffer = await this.brotliCompress(dataBuffer);
                    break;
                default:
                    throw new Error(`Unsupported compression method: ${method}`);
            }

            return this.arrayBufferToBase64(compressedBuffer);

        } catch (error) {
            console.error('Compression error:', error);
            // Fallback to simple base64
            return btoa(JSON.stringify(data));
        }
    }

    // Decompress data
    async decompressData(compressedData, method = 'gzip') {
        try {
            const compressedBuffer = this.base64ToArrayBuffer(compressedData);
            let decompressedBuffer;
            
            switch (method) {
                case 'gzip':
                    decompressedBuffer = await this.gzipDecompress(compressedBuffer);
                    break;
                case 'deflate':
                    decompressedBuffer = await this.deflateDecompress(compressedBuffer);
                    break;
                case 'br':
                    decompressedBuffer = await this.brotliDecompress(compressedBuffer);
                    break;
                default:
                    throw new Error(`Unsupported decompression method: ${method}`);
            }

            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decompressedBuffer));

        } catch (error) {
            console.error('Decompression error:', error);
            // Fallback to simple base64 decode
            try {
                return JSON.parse(atob(compressedData));
            } catch {
                return null;
            }
        }
    }

    // GZIP compression
    async gzipCompress(data) {
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(data);
        writer.close();
        
        return new Response(cs.readable).arrayBuffer();
    }

    // GZIP decompression
    async gzipDecompress(data) {
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        writer.write(data);
        writer.close();
        
        return new Response(ds.readable).arrayBuffer();
    }

    // Deflate compression
    async deflateCompress(data) {
        const cs = new CompressionStream('deflate');
        const writer = cs.writable.getWriter();
        writer.write(data);
        writer.close();
        
        return new Response(cs.readable).arrayBuffer();
    }

    // Deflate decompression
    async deflateDecompress(data) {
        const ds = new DecompressionStream('deflate');
        const writer = ds.writable.getWriter();
        writer.write(data);
        writer.close();
        
        return new Response(ds.readable).arrayBuffer();
    }

    // Brotli compression
    async brotliCompress(data) {
        const cs = new CompressionStream('br');
        const writer = cs.writable.getWriter();
        writer.write(data);
        writer.close();
        
        return new Response(cs.readable).arrayBuffer();
    }

    // Brotli decompression
    async brotliDecompress(data) {
        const ds = new DecompressionStream('br');
        const writer = ds.writable.getWriter();
        writer.write(data);
        writer.close();
        
        return new Response(ds.readable).arrayBuffer();
    }

    // Simple text compression (for small data)
    simpleTextCompress(text) {
        // Remove extra whitespace and compress
        return text
            .replace(/\s+/g, ' ')
            .replace(/\s*([{}()\[\].,;:!?])\s*/g, '$1')
            .trim();
    }

    // Calculate compression ratio
    calculateCompressionRatio(original, compressed) {
        const originalSize = new Blob([original]).size;
        const compressedSize = new Blob([compressed]).size;
        
        return {
            originalSize: originalSize,
            compressedSize: compressedSize,
            ratio: (compressedSize / originalSize) * 100,
            savings: ((originalSize - compressedSize) / originalSize) * 100
        };
    }

    // Optimize data for transmission
    async optimizeForTransmission(data) {
        try {
            // Try different compression methods
            const methods = ['gzip', 'deflate', 'br'];
            let bestResult = {
                data: JSON.stringify(data),
                method: 'none',
                size: new Blob([JSON.stringify(data)]).size
            };

            for (const method of methods) {
                try {
                    const compressed = await this.compressData(data, method);
                    const size = new Blob([compressed]).size;
                    
                    if (size < bestResult.size) {
                        bestResult = {
                            data: compressed,
                            method: method,
                            size: size
                        };
                    }
                } catch (error) {
                    continue;
                }
            }

            return bestResult;

        } catch (error) {
            console.error('Optimization error:', error);
            return {
                data: JSON.stringify(data),
                method: 'none',
                size: new Blob([JSON.stringify(data)]).size
            };
        }
    }

    // Batch compression for multiple data items
    async compressBatch(dataArray) {
        const compressedBatch = [];
        
        for (const data of dataArray) {
            try {
                const compressed = await this.compressData(data);
                compressedBatch.push({
                    originalSize: new Blob([JSON.stringify(data)]).size,
                    compressedSize: new Blob([compressed]).size,
                    data: compressed,
                    timestamp: Date.now()
                });
            } catch (error) {
                // Fallback to uncompressed
                compressedBatch.push({
                    originalSize: new Blob([JSON.stringify(data)]).size,
                    compressedSize: new Blob([JSON.stringify(data)]).size,
                    data: JSON.stringify(data),
                    timestamp: Date.now(),
                    error: error.message
                });
            }
        }

        return compressedBatch;
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

    // Check if compression is supported
    isCompressionSupported() {
        return 'CompressionStream' in window && 'DecompressionStream' in window;
    }

    // Get supported compression methods
    getSupportedMethods() {
        const methods = [];
        
        if (this.isCompressionSupported()) {
            methods.push('gzip', 'deflate');
            
            // Check if Brotli is supported
            try {
                new CompressionStream('br');
                methods.push('br');
            } catch (error) {
                // Brotli not supported
            }
        }
        
        return methods;
    }
}

// Export for use in other modules
window.DataCompression = DataCompression;
