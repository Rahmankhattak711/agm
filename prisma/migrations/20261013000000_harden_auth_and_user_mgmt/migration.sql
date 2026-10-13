-- Wipe existing refresh tokens so schema change succeeds (users will log in again)
DELETE FROM "refresh_tokens";

-- DropIndex
DROP INDEX IF EXISTS "refresh_tokens_token_key";

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN IF EXISTS "revoked",
DROP COLUMN IF EXISTS "token",
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "family_id" UUID NOT NULL,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "replaced_by_id" UUID,
ADD COLUMN     "revoked_at" TIMESTAMP(3),
ADD COLUMN     "token_hash" TEXT NOT NULL,
ADD COLUMN     "user_agent" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "created_by_id" UUID,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "locked_until" TIMESTAMP(3),
ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "password_changed_at" TIMESTAMP(3),
ADD COLUMN     "token_version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "is_active");

-- Enforce only one active SUPER_ADMIN via partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS one_super_admin ON users (role) WHERE role = 'SUPER_ADMIN';

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
