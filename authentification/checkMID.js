const express = require('express');
const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'Role not found' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        next();
    };
};
module.exports = {
    checkRole,
  };