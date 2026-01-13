const { PrismaClient } = require("@prisma/client");
const generateShortCode = require("../utils/shortCodeGenerator");
const isValidUrl = require("../utils/validateUrl")

const prisma = new PrismaClient();

//Shorten a URL
async function shortenUrl(req, res){
    try{
        const { originalUrl, expiresInDays } = req.body;

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

        // Generate unique short code
        let shortCode = generateShortCode();

        // Check if code already exists
        let existing = await prisma.shortenedUrl.findUnique({
            where: { shortCode } // equivalent to shortCode: shortCode
        });

        // If existing, generate new code
        while (existing){
            shortCode = generateShortCode();
            existing = await prisma.shortenedUrl.findUnique({
                where: { shortCode }
            });
        }

        // Save to database
        const shortened = await prisma.shortenedUrl.create({
            data: {
                shortCode,
                originalUrl,
                expiresAt
            }
        });

        res.status(201).json({
            shortCode: shortened.shortCode,
            originalUrl: shortened.originalUrl,
            shortUrl: `http://localhost:3000/${shortened.shortCode}`
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

        // Find URL in database
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

module.exports = { shortenUrl, redirectUrl, getAnalytics, getAllUrls }