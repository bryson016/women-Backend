-- Create a durable document table for bursary uploads in PostgreSQL/Neon.
CREATE TABLE IF NOT EXISTS "BursaryDocument" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "applicationId" INTEGER,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileData" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BursaryDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BursaryDocument_userId_idx" ON "BursaryDocument"("userId");
CREATE INDEX IF NOT EXISTS "BursaryDocument_applicationId_idx" ON "BursaryDocument"("applicationId");
CREATE INDEX IF NOT EXISTS "BursaryDocument_documentType_idx" ON "BursaryDocument"("documentType");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'BursaryDocument_userId_fkey'
      AND table_name = 'BursaryDocument'
  ) THEN
    ALTER TABLE "BursaryDocument"
      ADD CONSTRAINT "BursaryDocument_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'BursaryDocument_applicationId_fkey'
      AND table_name = 'BursaryDocument'
  ) THEN
    ALTER TABLE "BursaryDocument"
      ADD CONSTRAINT "BursaryDocument_applicationId_fkey"
      FOREIGN KEY ("applicationId") REFERENCES "BursaryApplication"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
