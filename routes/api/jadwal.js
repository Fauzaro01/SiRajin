const express = require("express");
const router = express.Router();
const prisma = require("../../config/database");

// router.get("/", async (req, res) => {
//   try {
//     const dataKelas = await prisma.kelas.findMany();
//     res
//       .json({
//         data: dataKelas,
//       })
//       .status(200);
//   } catch (error) {
//     res
//       .json({
//         message: "Gagal mendapatkan data kelas",
//       })
//       .status(500);
//   }
// });

// Contoh endpoint (Node.js Express)

router.get("/datatable", async (req, res) => {
  try {
    const { draw, start, length, search } = req.query;
    const searchValue = search?.value || "";

    // Base query
    const baseQuery = {
      include: {
        kelas: {
          select: {
            nama: true,
          },
        },
      },
      skip: parseInt(start),
      take: parseInt(length),
      where: {},
    };

    // Add search filter if exists
    if (searchValue) {
      baseQuery.where = {
        OR: [
          { kelas: { nama: { contains: searchValue, mode: "insensitive" } } },
          { hari: { contains: searchValue, mode: "insensitive" } },
          { jam_mulai: { contains: searchValue } },
          { jam_selesai: { contains: searchValue } },
        ],
      };
    }

    // Get filtered data
    const schedules = await prisma.jadwalAbsensi.findMany(baseQuery);

    // Get total records
    const totalRecords = await prisma.jadwalAbsensi.count();

    // Get filtered records count
    const filteredRecords = searchValue
      ? await prisma.jadwalAbsensi.count({ where: baseQuery.where })
      : totalRecords;

    res.json({
      draw: parseInt(draw),
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data: schedules,
    });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { kelasId, hari, jam_mulai, jam_selesai } = req.body;

    // Validate input
    if (!kelasId || !hari || !jam_mulai || !jam_selesai) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate time
    if (jam_mulai >= jam_selesai) {
      return res
        .status(400)
        .json({ message: "Jam selesai harus setelah jam mulai" });
    }

    // Check if class exists
    const kelasExists = await prisma.kelas.findUnique({
      where: { id: parseInt(kelasId) },
    });

    if (!kelasExists) {
      return res.status(400).json({ message: "Class not found" });
    }

    // Check for duplicate schedule (same class and day)
    const existingSchedule = await prisma.jadwalAbsensi.findFirst({
      where: {
        kelasId: parseInt(kelasId),
        hari,
      },
    });

    if (existingSchedule) {
      return res
        .status(400)
        .json({
          message: "Sudah ada jadwal untuk kelas ini di hari yang sama",
        });
    }

    // Create new schedule
    const newSchedule = await prisma.jadwalAbsensi.create({
      data: {
        kelasId: parseInt(kelasId),
        hari,
        jam_mulai,
        jam_selesai,
      },
    });

    res.status(201).json({
      message: "Schedule created successfully",
      data: newSchedule,
    });
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
   try {
     const { id } = req.params;
     const schedule = await prisma.jadwalAbsensi.findUnique({
       where: { id: parseInt(id) },
       include: {
         kelas: {
           select: {
             id: true,
             nama: true,
           },
         },
       },
     });

     if (!schedule) {
       return res.status(404).json({ message: "Schedule not found" });
     }

     res.json({
       data: schedule,
     });
   } catch (error) {
     console.error("Error fetching schedule:", error);
     res.status(500).json({ message: "Internal server error" });
   }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { kelasId, hari, jam_mulai, jam_selesai } = req.body;

    // Validate input
    if (!kelasId || !hari || !jam_mulai || !jam_selesai) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate time
    if (jam_mulai >= jam_selesai) {
      return res
        .status(400)
        .json({ message: "Jam selesai harus setelah jam mulai" });
    }

    // Check if schedule exists
    const scheduleExists = await prisma.jadwalAbsensi.findUnique({
      where: { id: parseInt(id) },
    });

    if (!scheduleExists) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Check if class exists
    const kelasExists = await prisma.kelas.findUnique({
      where: { id: parseInt(kelasId) },
    });

    if (!kelasExists) {
      return res.status(400).json({ message: "Class not found" });
    }

    // Check for duplicate schedule (same class and day, excluding current)
    const existingSchedule = await prisma.jadwalAbsensi.findFirst({
      where: {
        kelasId: parseInt(kelasId),
        hari,
        NOT: {
          id: parseInt(id),
        },
      },
    });

    if (existingSchedule) {
      return res
        .status(400)
        .json({
          message: "Sudah ada jadwal untuk kelas ini di hari yang sama",
        });
    }

    // Update schedule
    const updatedSchedule = await prisma.jadwalAbsensi.update({
      where: { id: parseInt(id) },
      data: {
        kelasId: parseInt(kelasId),
        hari,
        jam_mulai,
        jam_selesai,
      },
    });

    res.json({
      message: "Schedule updated successfully",
      data: updatedSchedule,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Schedule not found" });
    }
    console.error("Error updating schedule:", error);
    res.status(500).json({ message: "Internal server error" });
  }

});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.jadwalAbsensi.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Schedule not found" });
    }
    console.error("Error deleting schedule:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
