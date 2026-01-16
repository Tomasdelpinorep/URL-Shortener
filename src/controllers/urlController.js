const prisma = require('../db/prisma');
const generateShortCode = require('../utils/shortCodeGenerator');
const isValidUrl = require('../utils/validateUrl');
const redis = require('../db/redis');
const QRCode = require('qrcode');

const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}/api`;

//Shorten a URL
async function shortenUrl(req, res){
    try{
        const { originalUrl, expiresInDays, customCode } = req.body;

        // Validate URL
        if (!originalUrl){
            return res.status(400).json({error: 'URL is required.'});
        }

        if (!isValidUrl(originalUrl)){
            return res.status(400).json({error: 'Invalid URL format. Must be http or https URL.'});
        }

        // Calculate expiration date if provided
        let expiresAt = null;
        if (expiresInDays != null && Number.isFinite(expiresInDays) && expiresInDays >= 0) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }

        // Generate unique short code or use custom one entered by user
        let shortCode;

        if (customCode){
            // Validate custom code (alphanumeric, 3-20 chars)
            if (!/^[a-zA-Z0-9]{3,20}$/.test(customCode)) {
                return res.status(400).json({ 
                error: 'Custom code must be 3-20 alphanumeric characters' 
                });
            }

            // Check if existing
            const existing = await prisma.shortenedUrl.findUnique({
                where: { shortCode: customCode }
            });

            if (existing) {
                return res.status(409).json({
                    error: 'Custom code already taken. Please choose another.'
                });
            }
            
            shortCode = customCode;
        } else {
            // Generate random short code
            shortCode = generateShortCode();

            let existing = await prisma.shortenedUrl.findUnique({
                where: { shortCode }
            });

            while (existing){
                shortCode = generateShortCode();
                existing = await prisma.shortenedUrl.findUnique({
                    where: { shortCode }
                });
            }
        }

        // Save to database (with user ID if authenticated)
        const shortened = await prisma.shortenedUrl.create({
            data: {
                shortCode,
                originalUrl,
                expiresAt,
                userId: req.user ? req.user.userId : null
            }
        });

        res.status(201).json({
            shortCode: shortened.shortCode,
            originalUrl: shortened.originalUrl,
            shortUrl: `${baseUrl}/${shortened.shortCode}`,
            qrCode: `${baseUrl}/qr/${shortened.shortCode}`
        });

    }catch (error){
        console.error(error)
        res.status(500).json({error: 'Interval server error.'});
    }
}

// Redirect to original URL
async function redirectUrl(req, res){
    try{
        const { shortCode } = req.params;

        // Try to find in cache first
        const cachedUrl = await redis.get(`url:${shortCode}`);

        if (cachedUrl){
            console.log(`Cache HIT for ${shortCode}`);

            // Parse the cached data
            const urlData = JSON.parse(cachedUrl);

            if (urlData.expiresAt && new Date() > urlData.expiresAt){
                await redis.del(`url:${shortCode}`); // Delete expires URL from cache
                return res.status(410).json({error: 'This short URL has expired.'})
            }

            // Increment clicks
            prisma.shortenedUrl.update({
                where: { shortCode },
                data: { clicks: { increment: 1 } }
            }).catch(err => console.error('Failed to update clicks: ', err));
        
            // Redirect inmediately from cache
            return res.redirect(urlData.originalUrl);
        }

        // Cache miss - Find URL in database
        console.log(`Cache MISS for ${shortCode}`);
        const url = await prisma.shortenedUrl.findUnique({
            where: { shortCode }
        });

        if (!url){
            return res.status(400).json({error: 'Short URL not found.'});
        }

        // Check expiration
        if (url.expiresAt && new Date() > url.expiresAt){
            return res.status(410).json({ error: 'This short URL has expired' });
        }

        // Cache URL for 1 hour (3600 seconds)
        await redis.setex(
            `url:${shortCode}`,
            3600,
            JSON.stringify({
                originalUrl: url.originalUrl,
                expiresAt: url.expiresAt
            })
        );

        //Increment click count
        await prisma.shortenedUrl.update({
            where: { shortCode },
            data: { clicks: url.clicks + 1 }
        });

        res.redirect(url.originalUrl);

    }catch (error){
        console.error(error);
        res.status(500).json({error: 'Internal server error.'});
    }
}

// Get analytics for a short URL
async function getAnalytics(req, res){
    try{
        const { shortCode } = req.params; // equivalent to shortCode = req.params.shortCode

        // Find URL in databse
        const url = await prisma.shortenedUrl.findUnique({
            where: { shortCode }
        });

        if (!url){
            return res.status(404).json({ error: 'Short URL not found' });
        }

        // Return analytics data
        res.json({
            shortCode: url.shortCode,
            originalUrl: url.originalUrl,
            clicks: url.clicks,
            createdAt: url.createdAt,
            expiresAt: url.expiresAt
        });

    } catch (error){
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getAllUrls(req, res) {
    try{
        const urls = await prisma.shortenedUrl.findMany({
            where: {
                userId: req.user.userId
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.json({
            count: urls.length,
            urls: urls
        });

    }catch (error) {
        console.error(error);
        res.status(500).json({ error: "Interval server error."});
    }
}

async function deleteUrl(req, res){
    try{
        const { shortCode } = req.params;
        
        // Check if URL exists and belongs to user
        const url = await prisma.shortenedUrl.findUnique({
            where: { shortCode }
        });

        if (!url){
            return res.status(404).json({ error: "Short URL not found."})
        }

        // Check ownership
        if (url.userID !== req.user.userId){
            return res.status(403).json({ error: 'You do not have permission to delete this URL.' });
        }

        // Delete the URl from database
        await prisma.shortenedUrl.delete({
            where: { shortCode }
        });

        // Delete from cache
        await redis.del(`url:${shortCode}`);
        
        res.json({ 
            message: 'Short URL deleted successfully',
            shortCode: shortCode
        });

    }catch (error){
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getCacheStats(req, res){
    try{
        const info = await redis.info('stats');
        const keys = await redis.keys('url:*');

        res.json({
            cachedUrls: keys.length,
            redisInfo: info
        });
    }catch (error){
        console.error(error);
        res.status(500).json({error: 'Internal server error.'});
    }
}

async function generateQRCode(req, res){
    try{
        const { shortCode } = req.params;

        const url = await prisma.shortenedUrl.findUnique({
            where: { shortCode }
        });

        if (!url){
            return res.status(404).json({ error: 'Short URL not found.' });
        }

        // Check expiration
        if (url.expiresAt && new Date() > url.expiresAt){
            return res.status(410).json({ error: 'This short URL has expired.' });
        }

        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
        const shortUrl = `${baseUrl}/${shortCode}`

        const format = req.query.format || 'png';

        if (format === 'png'){
            // Generate QR code as PNG image
            const qrCodeBuffer = await QRCode.toBuffer(shortUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
        
            res.setHeader('Content-Type', 'image/png');
            res.send(qrCodeBuffer);

        }else if (format == 'svg'){
            const qrCodeSvg = await QRCode.toString(shortUrl, {
                type: 'svg',
                width: 300
            });

            res.setHeader('Content-Type', 'image/svg+xml');
            res.send(qrCodeSvg);
        }else if (format === 'json') {
            // Return data URL (for embedding in HTML)
            const qrCodeDataUrl = await QRCode.toDataURL(shortUrl, {
                width: 300
            });
            
            res.json({
                shortCode,
                shortUrl,
                qrCode: qrCodeDataUrl
            });
        
        } else {
            return res.status(400).json({ 
                error: 'Invalid format. Supported formats: png, svg, json' 
            });
        }
    } catch (error){
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { shortenUrl, redirectUrl, getAnalytics, getAllUrls, deleteUrl, getCacheStats, generateQRCode }