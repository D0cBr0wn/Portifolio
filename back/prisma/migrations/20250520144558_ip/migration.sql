/*
  Warnings:

  - The primary key for the `IpBan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `IpBan` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IpBan" (
    "ip" TEXT NOT NULL PRIMARY KEY,
    "reason" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL
);
INSERT INTO "new_IpBan" ("expiresAt", "ip", "reason") SELECT "expiresAt", "ip", "reason" FROM "IpBan";
DROP TABLE "IpBan";
ALTER TABLE "new_IpBan" RENAME TO "IpBan";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
