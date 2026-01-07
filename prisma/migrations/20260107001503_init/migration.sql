-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "stack_auth_id" TEXT NOT NULL,
    "display_name" TEXT,
    "algorithm_seed" VARCHAR(64) NOT NULL,
    "tolerance_seconds" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "auth_token" VARCHAR(64) NOT NULL,
    "ai_model" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "list_items" (
    "id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "list_id" TEXT NOT NULL,

    CONSTRAINT "list_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_stack_auth_id_key" ON "users"("stack_auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_algorithm_seed_key" ON "users"("algorithm_seed");

-- CreateIndex
CREATE UNIQUE INDEX "lists_auth_token_key" ON "lists"("auth_token");

-- CreateIndex
CREATE INDEX "lists_auth_token_idx" ON "lists"("auth_token");

-- CreateIndex
CREATE UNIQUE INDEX "lists_user_id_slug_key" ON "lists"("user_id", "slug");

-- CreateIndex
CREATE INDEX "list_items_list_id_created_at_idx" ON "list_items"("list_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "lists" ADD CONSTRAINT "lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
