-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ItemTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'SERVICE',
    "sku" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Stk.',
    "unitPriceNetCents" INTEGER NOT NULL DEFAULT 0,
    "taxRate" REAL NOT NULL DEFAULT 20,
    "materialCostCents" INTEGER,
    "laborHours" REAL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ItemTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ItemTemplate" ("createdAt", "description", "id", "laborHours", "materialCostCents", "taxRate", "title", "unit", "unitPriceNetCents", "updatedAt", "userId") SELECT "createdAt", "description", "id", "laborHours", "materialCostCents", "taxRate", "title", "unit", "unitPriceNetCents", "updatedAt", "userId" FROM "ItemTemplate";
DROP TABLE "ItemTemplate";
ALTER TABLE "new_ItemTemplate" RENAME TO "ItemTemplate";
CREATE INDEX "ItemTemplate_userId_idx" ON "ItemTemplate"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
