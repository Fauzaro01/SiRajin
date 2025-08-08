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

router.get('/siswa/edit', (req, res) => {
    res.render('siswa/edit-siswa');
})

router.get('/jadwal', ensureAuthenticated, (req, res) => {
    res.render('jadwal');
})

// router.get('/jadwal')

module.exports = router;