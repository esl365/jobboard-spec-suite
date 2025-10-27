-- Manual Migration: Add job enhancements and bookmarks
-- This migration adds P0+P1 features: location, remote, skills, logoUrl, and bookmarks

-- 1. Add new columns to Job table
ALTER TABLE `Job`
  ADD COLUMN `location` VARCHAR(255) NULL,
  ADD COLUMN `remote` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `skills` TEXT NULL;

-- 2. Add indexes for new Job columns
CREATE INDEX `Job_location_idx` ON `Job`(`location`);
CREATE INDEX `Job_remote_idx` ON `Job`(`remote`);

-- 3. Add logoUrl to UserCompanyProfile
ALTER TABLE `UserCompanyProfile`
  ADD COLUMN `logo_url` VARCHAR(500) NULL;

-- 4. Create Bookmark table
CREATE TABLE `Bookmark` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` BIGINT UNSIGNED NOT NULL,
  `jobId` BIGINT UNSIGNED NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `Bookmark_userId_jobId_key` (`userId`, `jobId`),
  KEY `Bookmark_userId_idx` (`userId`),
  KEY `Bookmark_jobId_idx` (`jobId`),

  CONSTRAINT `Bookmark_userId_fkey` FOREIGN KEY (`userId`)
    REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Bookmark_jobId_fkey` FOREIGN KEY (`jobId`)
    REFERENCES `Job`(`job_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
