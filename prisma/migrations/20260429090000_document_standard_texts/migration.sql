ALTER TABLE "CompanyProfile" ADD COLUMN "quoteIntroText" TEXT;
ALTER TABLE "CompanyProfile" ADD COLUMN "quoteOutroText" TEXT;
ALTER TABLE "CompanyProfile" ADD COLUMN "invoiceIntroText" TEXT;
ALTER TABLE "CompanyProfile" ADD COLUMN "invoiceOutroText" TEXT;
ALTER TABLE "Quote" ADD COLUMN "introText" TEXT;
ALTER TABLE "Quote" ADD COLUMN "outroText" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "introText" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "outroText" TEXT;
