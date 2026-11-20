-- Additive only: old application versions ignore this table. App rollback must
-- not drop recovery work or roll back schema; the feature remains opt-in.
CREATE TABLE "auth_recovery_requests" (
    "id" UUID NOT NULL,
    "recipient_hash" VARCHAR(64) NOT NULL,
    "payload_ciphertext" TEXT NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lease_until" TIMESTAMPTZ(6),
    "lease_token" UUID,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "auth_recovery_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "auth_recovery_requests_status_check" CHECK ("status" IN ('PENDING','PROCESSING','SENT','IGNORED','FAILED')),
    CONSTRAINT "auth_recovery_requests_attempts_check" CHECK ("attempts" >= 0),
    CONSTRAINT "auth_recovery_requests_hash_check" CHECK ("recipient_hash" ~ '^[0-9a-f]{64}$')
);
CREATE INDEX "auth_recovery_requests_status_available_at_lease_until_idx"
    ON "auth_recovery_requests"("status", "available_at", "lease_until");
CREATE INDEX "auth_recovery_requests_recipient_hash_created_at_idx"
    ON "auth_recovery_requests"("recipient_hash", "created_at");
