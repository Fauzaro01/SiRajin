const express = require('express');
const router = express.Router();

router.use('/kelas', require('./api/kelas'));
router.use('/siswa', require('./api/siswa'));
router.use('/rfid', require('./api/rfid'));

module.exports = router;