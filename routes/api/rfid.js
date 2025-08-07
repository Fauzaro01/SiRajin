const express = require('express');
const router = express.Router();
const cache = require('../../config/cache');

router.post('/scan', (req, res) => {
    try {
        const { rfid_kartu } = req.body;

        if (!rfid_kartu || typeof rfid_kartu !== 'string' || rfid_kartu.trim() === '') {
            return res.status(400).json({ message: 'Field "rfid_kartu" is required and must be a non-empty string.' });
        }

        cache.set('current-rfid', rfid_kartu, 300);

        return res.status(201).json({ message: 'RFID successfully scanned and stored.' });
    } catch (error) {
        console.error('Error in /scan:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

router.get('/getscan', (req, res) => {
    try {
        const rfid = cache.get('current-rfid') || null;

        return res.status(200).json({ rfid });
    } catch (error) {
        console.error('Error in /getscan:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;