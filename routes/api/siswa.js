const express = require('express');
const router = express.Router();
const prisma = require('../../config/database');

router.get('/', async (req, res) => {
    try {
        const datasiswa = prisma.siswa.findMany();
        res.json({
            siswa: datasiswa
        }).status(200);
    } catch (error) {
        res.json({
            message: 'Gagal mendapatkan data siswa'
        }).status(500);
    }
});

// Contoh endpoint (Node.js Express)
router.get('/datatable', async (req, res) => {
    try {
        const { draw, start, length, search } = req.query;
        const searchValue = search?.value || '';

        // Base query
        const baseQuery = {
            include: {
                kelas: {
                    select: {
                        nama: true
                    }
                }
            },
            skip: parseInt(start),
            take: parseInt(length),
            where: {}
        };

        // Add search filter if exists
        if (searchValue) {
            baseQuery.where = {
                OR: [
                    { nama: { contains: searchValue, mode: 'insensitive' } },
                    { nis: { contains: searchValue, mode: 'insensitive' } },
                    { uid_kartu: { contains: searchValue, mode: 'insensitive' } },
                    { kelas: { nama: { contains: searchValue, mode: 'insensitive' } } }
                ]
            };
        }

        // Get filtered data
        const students = await prisma.siswa.findMany(baseQuery);

        // Get total records
        const totalRecords = await prisma.siswa.count();

        // Get filtered records count
        const filteredRecords = searchValue 
            ? await prisma.siswa.count({ where: baseQuery.where })
            : totalRecords;

        res.json({
            draw: parseInt(draw),
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/', async (req, res) => {
     try {
        const { nis, nama, uid_kartu, kelasId } = req.body;

        // Validasi input
        if (!nis || !nama || !uid_kartu || !kelasId) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validasi format NIS
        if (!/^\d+$/.test(nis)) {
            return res.status(400).json({ message: 'NIS must contain only numbers' });
        }

        // Validasi kelas exists
        const kelasExists = await prisma.kelas.findUnique({
            where: { id: parseInt(kelasId) }
        });

        if (!kelasExists) {
            return res.status(400).json({ message: 'Class not found' });
        }

        // Validasi UID unik
        const existingCard = await prisma.siswa.findUnique({
            where: { uid_kartu }
        });

        if (existingCard) {
            return res.status(400).json({ message: 'RFID card already registered to another student' });
        }

        // Validasi NIS unik
        const existingNIS = await prisma.siswa.findUnique({
            where: { nis }
        });

        if (existingNIS) {
            return res.status(400).json({ message: 'NIS already registered' });
        }

        // Create new student
        const newStudent = await prisma.siswa.create({
            data: {
                nis,
                nama,
                uid_kartu,
                kelasId: parseInt(kelasId)
            }
        });

        res.status(201).json({ 
            message: 'Student created successfully',
            data: newStudent
        });
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.absensi.deleteMany({
            where: { siswaId: parseInt(id) }
        });

        await prisma.siswa.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Student not found' });
        }
        console.error('Error deleting student:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
})

router.get('/:id', async (req, res) => {
    try {
    const { id } = req.params;
    
    const siswa = await prisma.siswa.findUnique({
      where: { id: parseInt(id) },
      include: {
        kelas: true
      }
    });

    if (!siswa) {
      return res.status(404).json({ 
        success: false,
        message: 'Siswa tidak ditemukan' 
      });
    }

    res.json({
      success: true,
      data: siswa
    });
  } catch (error) {
    console.error('Error fetching siswa:', error);
    res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil data siswa',
      error: error.message 
    });
  }
})

router.put('/:id', async(req, res) => {
     try {
       const { id } = req.params;
       const { nis, nama, uid_kartu, kelasId } = req.body;

       // Validasi input
       if (!nis || !nama || !uid_kartu || !kelasId) {
         return res.status(400).json({
           success: false,
           message: "Semua field harus diisi",
         });
       }

       // Cek apakah kelas ada
       const kelasExists = await prisma.kelas.findUnique({
         where: { id: parseInt(kelasId) },
       });

       if (!kelasExists) {
         return res.status(400).json({
           success: false,
           message: "Kelas tidak valid",
         });
       }

       // Cek apakah NIS sudah digunakan oleh siswa lain
       const nisExists = await prisma.siswa.findFirst({
         where: {
           nis,
           NOT: {
             id: parseInt(id),
           },
         },
       });

       if (nisExists) {
         return res.status(400).json({
           success: false,
           message: "NIS sudah digunakan oleh siswa lain",
         });
       }

       // Cek apakah UID kartu sudah digunakan oleh siswa lain
       const uidExists = await prisma.siswa.findFirst({
         where: {
           uid_kartu,
           NOT: {
             id: parseInt(id),
           },
         },
       });

       if (uidExists) {
         return res.status(400).json({
           success: false,
           message: "UID kartu sudah digunakan oleh siswa lain",
         });
       }

       // Update data siswa
       const updatedSiswa = await prisma.siswa.update({
         where: { id: parseInt(id) },
         data: {
           nis,
           nama,
           uid_kartu,
           kelasId: parseInt(kelasId),
         },
         include: {
           kelas: true,
         },
       });

       res.json({
         success: true,
         message: "Data siswa berhasil diperbarui",
         data: updatedSiswa,
       });
     } catch (error) {
       console.error("Error updating siswa:", error);
       res.status(500).json({
         success: false,
         message: "Gagal memperbarui data siswa",
         error: error.message,
       });
     }

})

module.exports = router;