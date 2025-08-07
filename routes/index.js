const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../middleware/auth');

router.get('/', (req, res) => {
    res.render('index');
})

router.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.render('dashboard');
})

router.get('/kelas', ensureAuthenticated, (req, res) => {
    res.render('kelas');
})

router.get('/siswa', ensureAuthenticated, (req, res) => {
    res.render('siswa/index');
})

router.get('/siswa/tambah', (req, res) => {
    res.render('siswa/tambah-siswa');
})


module.exports = router;