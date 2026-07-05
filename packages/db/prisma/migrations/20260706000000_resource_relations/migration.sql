-- CreateTable
CREATE TABLE "resource_relations" (
    "id" TEXT NOT NULL,
    "from_type" TEXT NOT NULL,
    "from_id" TEXT NOT NULL,
    "to_type" TEXT NOT NULL,
    "to_id" TEXT NOT NULL,
    "relation_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "resource_relations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resource_relations_from_type_from_id_idx" ON "resource_relations"("from_type", "from_id");

-- CreateIndex
CREATE INDEX "resource_relations_to_type_to_id_idx" ON "resource_relations"("to_type", "to_id");

-- CreateIndex
CREATE UNIQUE INDEX "resource_relations_from_type_from_id_to_type_to_id_relation_key" ON "resource_relations"("from_type", "from_id", "to_type", "to_id", "relation_type");
