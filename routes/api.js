const express = require('express');
const router = express.Router();

router.use('/kelas', require('./api/kelas'));
router.use('/siswa', require('./api/siswa'));
router.use('/rfid', require('./api/rfid'));
router.use('/jadwal', require('./api/jadwal'));

module.exports = router;