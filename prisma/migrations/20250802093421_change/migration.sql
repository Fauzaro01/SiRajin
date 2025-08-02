/*
  Warnings:

  - You are about to alter the column `status` on the `absensi` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `absensi` MODIFY `status` ENUM('HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALFA') NOT NULL;
