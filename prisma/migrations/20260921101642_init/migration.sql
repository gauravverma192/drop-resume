-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'SHORTLISTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ParseStatus" AS ENUM ('PENDING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyName" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "candidateEmail" TEXT NOT NULL,
    "candidatePhone" TEXT,
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileMime" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "parseStatus" "ParseStatus" NOT NULL DEFAULT 'PENDING',
    "parseError" TEXT,
    "rawText" TEXT,
    "aiSummary" TEXT,
    "matchScore" INTEGER,
    "matchScoreReason" TEXT,
    "parsedName" TEXT,
    "parsedEmail" TEXT,
    "parsedPhone" TEXT,
    "currentTitle" TEXT,
    "currentCompany" TEXT,
    "yearsExperience" DOUBLE PRECISION,
    "highlySkilledAt" TEXT,
    "location" TEXT,
    "skills" TEXT[],
    "education" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmitAttempt" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmitAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");

-- CreateIndex
CREATE INDEX "Role_ownerId_idx" ON "Role"("ownerId");

-- CreateIndex
CREATE INDEX "Submission_roleId_status_idx" ON "Submission"("roleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_roleId_candidateEmail_key" ON "Submission"("roleId", "candidateEmail");

-- CreateIndex
CREATE INDEX "SubmitAttempt_ipHash_createdAt_idx" ON "SubmitAttempt"("ipHash", "createdAt");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
