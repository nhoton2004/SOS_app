const express = require('express');
const authRoutes = require('./auth.routes');
const articleRoutes = require('./article.routes');
const sosRoutes = require('./sos.routes');
const adminRoutes = require('./admin.routes');
const volunteerRoutes = require('./volunteer.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/articles', articleRoutes);
router.use('/sos', sosRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/volunteers', volunteerRoutes);

module.exports = router;
