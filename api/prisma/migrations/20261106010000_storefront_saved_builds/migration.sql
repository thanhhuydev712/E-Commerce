BEGIN;
CREATE TABLE "saved_pc_builds" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "schema_version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "saved_pc_builds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "saved_pc_builds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "saved_pc_builds_name_check" CHECK (length(trim("name")) BETWEEN 1 AND 150),
  CONSTRAINT "saved_pc_builds_version_check" CHECK ("schema_version" = 1)
);
CREATE INDEX "saved_pc_builds_user_id_created_at_id_idx" ON "saved_pc_builds"("user_id", "created_at", "id");
CREATE TABLE "saved_pc_build_components" (
  "build_id" UUID NOT NULL,
  "slot" VARCHAR(32) NOT NULL,
  "product_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_pc_build_components_pkey" PRIMARY KEY ("build_id", "slot"),
  CONSTRAINT "saved_pc_build_components_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "saved_pc_builds"("id") ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT "saved_pc_build_components_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "saved_pc_build_components_slot_check" CHECK ("slot" IN ('cpu','mainboard','ram','gpu','ssd','psu','case','cooler'))
);
CREATE INDEX "saved_pc_build_components_product_id_idx" ON "saved_pc_build_components"("product_id");
COMMIT;
