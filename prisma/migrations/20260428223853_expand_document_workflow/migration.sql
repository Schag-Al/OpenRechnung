-- CreateTable
CREATE TABLE "NumberSequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "prefix" TEXT NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NumberSequence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Stk.',
    "unitPriceNetCents" INTEGER NOT NULL DEFAULT 0,
    "taxRate" REAL NOT NULL DEFAULT 20,
    "materialCostCents" INTEGER,
    "laborHours" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ItemTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CompanyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "ownerName" TEXT,
    "street" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Oesterreich',
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "vatId" TEXT,
    "taxNumber" TEXT,
    "bankName" TEXT,
    "iban" TEXT,
    "bic" TEXT,
    "defaultPaymentDays" INTEGER NOT NULL DEFAULT 14,
    "defaultTaxRate" REAL NOT NULL DEFAULT 20,
    "defaultTaxMode" TEXT NOT NULL DEFAULT 'STANDARD',
    "brandColor" TEXT NOT NULL DEFAULT '#b56b37',
    "logoUrl" TEXT,
    "logoDataUrl" TEXT,
    "quotePrefix" TEXT NOT NULL DEFAULT 'ANG',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'RE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CompanyProfile" ("bankName", "bic", "city", "companyName", "country", "createdAt", "defaultPaymentDays", "defaultTaxRate", "email", "iban", "id", "logoUrl", "ownerName", "phone", "postalCode", "street", "taxNumber", "updatedAt", "userId", "vatId", "website") SELECT "bankName", "bic", "city", "companyName", "country", "createdAt", "defaultPaymentDays", "defaultTaxRate", "email", "iban", "id", "logoUrl", "ownerName", "phone", "postalCode", "street", "taxNumber", "updatedAt", "userId", "vatId", "website" FROM "CompanyProfile";
DROP TABLE "CompanyProfile";
ALTER TABLE "new_CompanyProfile" RENAME TO "CompanyProfile";
CREATE UNIQUE INDEX "CompanyProfile_userId_key" ON "CompanyProfile"("userId");
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "quoteId" TEXT,
    "number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "taxMode" TEXT NOT NULL DEFAULT 'STANDARD',
    "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceDate" DATETIME,
    "servicePeriod" TEXT,
    "dueDate" DATETIME NOT NULL,
    "note" TEXT,
    "subtotalNetCents" INTEGER NOT NULL DEFAULT 0,
    "taxTotalCents" INTEGER NOT NULL DEFAULT 0,
    "totalGrossCents" INTEGER NOT NULL DEFAULT 0,
    "paidAt" DATETIME,
    "lockedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("createdAt", "customerId", "dueDate", "id", "invoiceDate", "note", "number", "paidAt", "quoteId", "serviceDate", "servicePeriod", "status", "subtotalNetCents", "taxTotalCents", "totalGrossCents", "updatedAt", "userId") SELECT "createdAt", "customerId", "dueDate", "id", "invoiceDate", "note", "number", "paidAt", "quoteId", "serviceDate", "servicePeriod", "status", "subtotalNetCents", "taxTotalCents", "totalGrossCents", "updatedAt", "userId" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE INDEX "Invoice_userId_idx" ON "Invoice"("userId");
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");
CREATE INDEX "Invoice_quoteId_idx" ON "Invoice"("quoteId");
CREATE UNIQUE INDEX "Invoice_userId_number_key" ON "Invoice"("userId", "number");
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "taxMode" TEXT NOT NULL DEFAULT 'STANDARD',
    "quoteDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" DATETIME,
    "note" TEXT,
    "subtotalNetCents" INTEGER NOT NULL DEFAULT 0,
    "taxTotalCents" INTEGER NOT NULL DEFAULT 0,
    "totalGrossCents" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("createdAt", "customerId", "id", "note", "number", "quoteDate", "status", "subtotalNetCents", "taxTotalCents", "totalGrossCents", "updatedAt", "userId", "validUntil") SELECT "createdAt", "customerId", "id", "note", "number", "quoteDate", "status", "subtotalNetCents", "taxTotalCents", "totalGrossCents", "updatedAt", "userId", "validUntil" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE INDEX "Quote_userId_idx" ON "Quote"("userId");
CREATE INDEX "Quote_customerId_idx" ON "Quote"("customerId");
CREATE UNIQUE INDEX "Quote_userId_number_key" ON "Quote"("userId", "number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "NumberSequence_userId_idx" ON "NumberSequence"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NumberSequence_userId_kind_year_key" ON "NumberSequence"("userId", "kind", "year");

-- CreateIndex
CREATE INDEX "ItemTemplate_userId_idx" ON "ItemTemplate"("userId");
