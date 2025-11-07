hereconst helmet = require('helmet');

// Advanced stealth headers configuration
const stealthHeaders = (req, res, next) => {
    // Remove identifying headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('X-AspNet-Version');
    res.removeHeader('X-AspNetMvc-Version');
    
    // Set security headers that look legitimate
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Cache control for static assets
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    
    // Content security policy that allows necessary resources
    res.setHeader('Content-Security-Policy', 
        "default-src 'self' https: 'unsafe-inline' 'unsafe-eval'; " +
        "img-src 'self' data: https:; " +
        "style-src 'self' 'unsafe-inline' https:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;"
    );
    
    next();
};

// Fake server signature
const fakeServerSignature = (req, res, next) => {
    res.setHeader('Server', 'nginx/1.18.0');
    next();
};

// Request filtering
const requestFilter = (req, res, next) => {
    // Block common hacking tools
    const blockedUserAgents = [
        'sqlmap', 
        'nikto',
        'nmap',
        'metasploit',
        'burpsuite',
        'zap',
        'wpscan',
        'acunetix'
    ];
    
    const userAgent = req.get('User-Agent') || '';
    
    if (blockedUserAgents.some(tool => userAgent.toLowerCase().includes(tool))) {
        return res.status(403).send('Forbidden');
    }
    
    // Block suspicious IPs
    const suspiciousIPs = JSON.parse(process.env.BLOCKED_IPS || '[]');
    if (suspiciousIPs.includes(req.ip)) {
        return res.status(403).send('Forbidden');
    }
    
    next();
};

module.exports = {
    stealthHeaders,
    fakeServerSignature, 
    requestFilter
};
