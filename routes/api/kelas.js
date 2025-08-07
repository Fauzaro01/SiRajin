const express = require('express');
const router = express.Router();
const prisma = require('../../config/database');

router.get('/', async (req, res) => {
    try {
        const dataKelas = prisma.kelas.findMany();
        res.json({
            kelas: dataKelas
        }).status(200);
    } catch (error) {
        res.json({
            message: 'Gagal mendapatkan data kelas'
        }).status(500);
    }
});

// Contoh endpoint (Node.js Express)
router.get('/datatable', async (req, res) => {
    try {
        const { draw, start, length, search } = req.query;

        // Pastikan search memiliki nilai default jika undefined
        const searchValue = search?.value || '';

        // Query ke database dengan pagination dan search
        const classes = await prisma.kelas.findMany({
            skip: parseInt(start) || 0,
            take: parseInt(length) || 10,
            where: {
                OR: [
                    { nama: { contains: searchValue } }
                ]
            },
            include: {
                siswa: true // Mengambil data siswa terkait
            }
        });

        // Hitung total data
        const totalRecords = await prisma.kelas.count();
        const filteredRecords = await prisma.kelas.count({
            where: {
                OR: [
                    { nama: { contains: searchValue } }
                ]
            }
        });

        // Format data untuk DataTables
        const formattedData = classes.map(kelas => ({
            id: kelas.id,
            nama: kelas.nama,
            siswa_count: kelas.siswa.length // Hitung jumlah siswa
        }));

        res.json({
            draw: parseInt(draw) || 0,
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { nama } = req.body;

        if (!nama) {
            return res.status(400).json({ message: 'Class name is required' });
        }

        const newClass = await prisma.kelas.create({
            data: { nama }
        });

        res.status(201).json({ 
            message: 'Class created successfully',
            data: newClass
        });
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if class has students
        const studentsCount = await prisma.siswa.count({
            where: { kelasId: parseInt(id) }
        });

        if (studentsCount > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete class with students. Please remove students first.' 
            });
        }

        // Delete related schedules first
        await prisma.jadwalAbsensi.deleteMany({
            where: { kelasId: parseInt(id) }
        });

        // Then delete the class
        await prisma.kelas.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Class not found' });
        }
        console.error('Error deleting class:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})


module.exports = router;