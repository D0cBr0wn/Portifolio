-- AlterTable
ALTER TABLE "Venue" ADD COLUMN "address1" TEXT;
ALTER TABLE "Venue" ADD COLUMN "address2" TEXT;
ALTER TABLE "Venue" ADD COLUMN "zipCode" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mfaSecret" TEXT,
    "banUntil" DATETIME
);

-- CreateTable
CREATE TABLE "IpBan" (
    "ip" TEXT NOT NULL PRIMARY KEY,
    "reason" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FailedLoginAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ip" TEXT NOT NULL,
    "emailTried" TEXT NOT NULL,
    "date" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
