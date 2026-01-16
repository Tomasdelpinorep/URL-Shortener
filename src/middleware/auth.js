const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next){
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer token

    if (!token){
        return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) =>{
        if (err){
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }

        // Add user info to request
        req.user = user;
        next();
    });
}

// Optional authentication - doesn't fail if no token
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  
  next();
}

module.exports = { authenticateToken, optionalAuth };