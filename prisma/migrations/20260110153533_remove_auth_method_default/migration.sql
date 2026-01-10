-- AlterTable
ALTER TABLE "lists" ALTER COLUMN "auth_method" DROP NOT NULL,
ALTER COLUMN "auth_method" DROP DEFAULT;
