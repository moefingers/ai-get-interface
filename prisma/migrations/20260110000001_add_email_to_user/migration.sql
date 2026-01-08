-- Add email column to users table
-- Step 1: Add nullable column first
ALTER TABLE "users" ADD COLUMN "email" TEXT;

-- Step 2: Set placeholder emails for existing users (will be updated on next login)
UPDATE "users" SET "email" = CONCAT('unknown-', id, '@placeholder.local') WHERE "email" IS NULL;

-- Step 3: Make column required and add unique constraint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
