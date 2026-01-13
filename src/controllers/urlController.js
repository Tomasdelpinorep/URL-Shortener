const { PrismaClient } = require("@prisma/client");
const generateShortCode = require("../utils/shortCodeGenerator");

const prisma = new PrismaClient();

//Shorten a URL
async function shortenUrl(req, res){
    try{
        const { originalUrl } = req.body;

        // Validate URL
        if (!originalUrl){
            return res.status(400).json({error: 'URL is required.'});
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
                originalUrl
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

module.exports = { shortenUrl, redirectUrl }