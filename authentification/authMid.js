const express = require('express');
const oracledb = require('oracledb');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
function authenticateToken(req, res, next) {
    const token = req.cookies.access_token;

    if (!token) {
        return res.status(403).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }

        req.user = user;
        next();
    });
}
module.exports = {
    authenticateToken,
  }; 