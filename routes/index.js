const express = require('express');
const authRoutes = require('./auth.routes');
const articleRoutes = require('./article.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/articles', articleRoutes);

module.exports = router;
