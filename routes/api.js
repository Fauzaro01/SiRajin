const express = require('express');
const router = express.Router();

router.use('/kelas', require('./api/kelas'));

module.exports = router;