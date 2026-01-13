function  isValidUrl(urlString){
    try{
        const url = new URL(urlString);

        // Check protocol
        return url.protocol === "http:" || url.protocol === "https:";
    }catch (error){
        return false;
    }
}

module.exports = isValidUrl;