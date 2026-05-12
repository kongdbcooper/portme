CREATE TABLE "email_change_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newEmail" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_change_verifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_change_verifications_userId_used_expiresAt_idx"
ON "email_change_verifications"("userId", "used", "expiresAt");

CREATE INDEX "email_change_verifications_newEmail_used_idx"
ON "email_change_verifications"("newEmail", "used");

ALTER TABLE "email_change_verifications"
ADD CONSTRAINT "email_change_verifications_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
