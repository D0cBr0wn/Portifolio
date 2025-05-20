/*
  Warnings:

  - You are about to drop the column `user` on the `FailedLoginAttempt` table. All the data in the column will be lost.
  - Added the required column `emailTried` to the `FailedLoginAttempt` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FailedLoginAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ip" TEXT NOT NULL,
    "emailTried" TEXT NOT NULL,
    "date" DATETIME NOT NULL
);
INSERT INTO "new_FailedLoginAttempt" ("date", "id", "ip") SELECT "date", "id", "ip" FROM "FailedLoginAttempt";
DROP TABLE "FailedLoginAttempt";
ALTER TABLE "new_FailedLoginAttempt" RENAME TO "FailedLoginAttempt";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
