-- CreateTable
CREATE TABLE `UploadedDocument` (
  `id` VARCHAR(191) NOT NULL,
  `sessionId` VARCHAR(191) NOT NULL,
  `fileName` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UploadedDocument` ADD CONSTRAINT `UploadedDocument_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`sessionId`) ON DELETE RESTRICT ON UPDATE CASCADE;
