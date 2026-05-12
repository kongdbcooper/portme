-- CreateTable
CREATE TABLE "password_change_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newPasswordHash" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_change_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "password_change_verifications_userId_used_expiresAt_idx" ON "password_change_verifications"("userId", "used", "expiresAt");

-- AddForeignKey
ALTER TABLE "password_change_verifications" ADD CONSTRAINT "password_change_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
