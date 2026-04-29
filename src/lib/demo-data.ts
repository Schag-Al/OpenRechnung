import { addDays } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

const CURRENT_YEAR = new Date().getFullYear();

function demoNumber(prefix: string, sequence: number): string {
  return `${prefix}-${CURRENT_YEAR}-${String(sequence).padStart(4, "0")}`;
}

async function clearDemoData(userId: string): Promise<void> {
  await prisma.invoice.deleteMany({ where: { userId } });
  await prisma.quote.deleteMany({ where: { userId } });
  await prisma.customer.deleteMany({ where: { userId } });
  await prisma.materialCalculation.deleteMany({ where: { userId } });
  await prisma.itemTemplate.deleteMany({ where: { userId } });
  await prisma.featureSuggestion.deleteMany({ where: { userId } });
  await prisma.numberSequence.deleteMany({ where: { userId } });
  await prisma.companyProfile.deleteMany({ where: { userId } });
}

async function seedDemoData(userId: string): Promise<void> {
  const now = new Date();
  const overdueDueDate = addDays(now, -9);
  const currentDueDate = addDays(now, 14);
  const futureDueDate = addDays(now, 28);

  await prisma.companyProfile.create({
    data: {
      userId,
      companyName: "Muster & Sohn Handwerk GmbH",
      ownerName: "Thomas Muster",
      street: "Werkstrasse 12",
      postalCode: "1010",
      city: "Wien",
      country: "Oesterreich",
      email: "office@muster-handwerk.test",
      phone: "+43 1 234567",
      website: "https://muster-handwerk.test",
      vatId: "ATU12345678",
      taxNumber: "12-345/6789",
      bankName: "Musterbank Wien",
      iban: "AT611904300234573201",
      bic: "MUBAATWW",
      defaultPaymentDays: 14,
      defaultTaxRate: 20,
      defaultTaxMode: "STANDARD",
      brandColor: "#0f766e",
      quotePrefix: "ANG",
      invoicePrefix: "RE",
      quoteIntroText: "Vielen Dank fuer Ihre Anfrage. Gerne bieten wir Ihnen folgende Leistungen fachgerecht und nachvollziehbar an:",
      quoteOutroText: "Die Ausfuehrung erfolgt nach gemeinsamer Terminabstimmung. Materialmengen werden vor Ort final geprueft.",
      invoiceIntroText: "Fuer die erbrachten Leistungen erlauben wir uns, wie folgt zu verrechnen:",
      invoiceOutroText: null
    }
  });

  const bauhof = await prisma.customer.create({
    data: {
      userId,
      name: "Bauhof Beispiel GmbH",
      contactPerson: "Erika Beispiel",
      street: "Kundenweg 5",
      postalCode: "4020",
      city: "Linz",
      country: "Oesterreich",
      email: "einkauf@bauhof-beispiel.test",
      phone: "+43 732 123456",
      vatId: "ATU87654321",
      notes: "B2B-Testkunde: typische Rechnung mit UID, Zahlungsziel und mehreren Positionen."
    }
  });

  const elektro = await prisma.customer.create({
    data: {
      userId,
      name: "Elektro Partner Projektbau KG",
      contactPerson: "Martin Leitner",
      street: "Industriezeile 18",
      postalCode: "4600",
      city: "Wels",
      country: "Oesterreich",
      email: "rechnung@elektro-partner.test",
      phone: "+43 7242 55588",
      vatId: "ATU44556677",
      notes: "B2B-Testkunde fuer Reverse-Charge-/Projekt-Szenarien."
    }
  });

  const privat = await prisma.customer.create({
    data: {
      userId,
      name: "Familie Berger",
      contactPerson: "Anna Berger",
      street: "Gartenweg 18",
      postalCode: "3100",
      city: "St. Poelten",
      country: "Oesterreich",
      email: "familie.berger@example.test",
      phone: "+43 2742 112233",
      notes: "B2C-Testkunde: Privatkunde ohne UID."
    }
  });

  const pension = await prisma.customer.create({
    data: {
      userId,
      name: "Pension Waldruh",
      contactPerson: "Johanna Gruber",
      street: "Almstrasse 7",
      postalCode: "5640",
      city: "Bad Gastein",
      country: "Oesterreich",
      email: "office@pension-waldruh.test",
      phone: "+43 6434 7788",
      notes: "Kleiner Betrieb ohne hinterlegte UID, gut fuer gemischte Stammdaten."
    }
  });

  await prisma.materialCalculation.createMany({
    data: [
      {
        userId,
        title: "Montagepaket Sanitaer",
        materialCostCents: 9800,
        markupPercent: 25,
        salePriceCents: 12250,
        laborHours: 2,
        hourlyRateCents: 7500,
        travelCostCents: 3000,
        totalNetCents: 30250
      },
      {
        userId,
        title: "Material und Arbeit Malerzimmer",
        materialCostCents: 6400,
        markupPercent: 30,
        salePriceCents: 8320,
        laborHours: 5,
        hourlyRateCents: 6200,
        travelCostCents: 1800,
        totalNetCents: 41120
      },
      {
        userId,
        title: "Gartenzaun Reparaturpaket",
        materialCostCents: 18500,
        markupPercent: 18,
        salePriceCents: 21830,
        laborHours: 4,
        hourlyRateCents: 6800,
        travelCostCents: 2500,
        totalNetCents: 51530
      }
    ]
  });

  await prisma.itemTemplate.createMany({
    data: [
      {
        userId,
        kind: "SERVICE",
        title: "Montagestunde",
        description: "Facharbeit vor Ort",
        unit: "Std.",
        unitPriceNetCents: 7500,
        taxRate: 20,
        laborHours: 1
      },
      {
        userId,
        kind: "SERVICE",
        title: "Anfahrt",
        description: "Anfahrtspauschale im Stadtgebiet",
        unit: "Pauschale",
        unitPriceNetCents: 3000,
        taxRate: 20
      },
      {
        userId,
        kind: "ARTICLE",
        sku: "MAT-KLEIN",
        title: "Kleinmaterial",
        description: "Kleinmaterial und Befestigungsmaterial",
        unit: "Pauschale",
        unitPriceNetCents: 4500,
        taxRate: 20,
        materialCostCents: 2800
      }
    ]
  });

  const quoteDraft = await prisma.quote.create({
    data: {
      userId,
      customerId: privat.id,
      number: demoNumber("ANG", 1),
      status: "DRAFT",
      taxMode: "STANDARD",
      quoteDate: now,
      validUntil: addDays(now, 21),
      note: "Entwurf: Gartenzaun pruefen, Materialmenge vor Ort final bestaetigen.",
      subtotalNetCents: 51530,
      taxTotalCents: 10306,
      totalGrossCents: 61836,
      items: {
        create: [
          {
            description: "Gartenzaun Reparaturpaket",
            quantity: 1,
            unit: "Pauschale",
            unitPriceNetCents: 51530,
            taxRate: 20,
            materialCostCents: 21830,
            laborHours: 4,
            sortOrder: 0
          }
        ]
      }
    }
  });

  const quoteSent = await prisma.quote.create({
    data: {
      userId,
      customerId: bauhof.id,
      number: demoNumber("ANG", 2),
      status: "SENT",
      taxMode: "STANDARD",
      quoteDate: addDays(now, -3),
      validUntil: addDays(now, 11),
      note: "Gesendetes B2B-Angebot fuer Sanitaerarbeiten im Verwaltungsgebaeude.",
      subtotalNetCents: 45250,
      taxTotalCents: 9050,
      totalGrossCents: 54300,
      lockedAt: addDays(now, -3),
      items: {
        create: [
          {
            description: "Montagepaket Sanitaer",
            quantity: 1,
            unit: "Pauschale",
            unitPriceNetCents: 30250,
            taxRate: 20,
            materialCostCents: 12250,
            laborHours: 2,
            sortOrder: 0
          },
          {
            description: "Zusaetzliche Montagestunden",
            quantity: 2,
            unit: "Std.",
            unitPriceNetCents: 7500,
            taxRate: 20,
            laborHours: 2,
            sortOrder: 1
          }
        ]
      }
    }
  });

  await prisma.quote.create({
    data: {
      userId,
      customerId: elektro.id,
      number: demoNumber("ANG", 3),
      status: "ACCEPTED",
      taxMode: "REVERSE_CHARGE",
      quoteDate: addDays(now, -12),
      validUntil: addDays(now, 2),
      note: "Angenommenes Projektangebot mit Reverse-Charge-Hinweis fuer B2B-Testfall.",
      subtotalNetCents: 96000,
      taxTotalCents: 0,
      totalGrossCents: 96000,
      lockedAt: addDays(now, -10),
      items: {
        create: [
          {
            description: "Elektro-Unterverteilung vorbereiten",
            quantity: 12,
            unit: "Std.",
            unitPriceNetCents: 8000,
            taxRate: 20,
            laborHours: 12,
            sortOrder: 0
          }
        ]
      }
    }
  });

  await prisma.quote.create({
    data: {
      userId,
      customerId: pension.id,
      number: demoNumber("ANG", 4),
      status: "REJECTED",
      taxMode: "STANDARD",
      quoteDate: addDays(now, -20),
      validUntil: addDays(now, -5),
      note: "Abgelehntes Beispielangebot fuer Malerarbeiten in Gaestezimmern.",
      subtotalNetCents: 41120,
      taxTotalCents: 8224,
      totalGrossCents: 49344,
      lockedAt: addDays(now, -18),
      items: {
        create: [
          {
            description: "Material und Arbeit Malerzimmer",
            quantity: 1,
            unit: "Pauschale",
            unitPriceNetCents: 41120,
            taxRate: 20,
            materialCostCents: 8320,
            laborHours: 5,
            sortOrder: 0
          }
        ]
      }
    }
  });

  await prisma.invoice.create({
    data: {
      userId,
      customerId: bauhof.id,
      quoteId: quoteSent.id,
      number: demoNumber("RE", 1),
      status: "OVERDUE",
      taxMode: "STANDARD",
      invoiceDate: addDays(overdueDueDate, -14),
      serviceDate: addDays(overdueDueDate, -15),
      servicePeriod: "KW 14, Sanitaerarbeiten Verwaltungsgebaeude",
      dueDate: overdueDueDate,
      note: "Diese Demo-Rechnung ist absichtlich ueberfaellig, damit Erinnerungstexte sichtbar sind.",
      subtotalNetCents: 45250,
      taxTotalCents: 9050,
      totalGrossCents: 54300,
      lockedAt: addDays(overdueDueDate, -14),
      items: {
        create: [
          {
            description: "Montagepaket Sanitaer",
            quantity: 1,
            unit: "Pauschale",
            unitPriceNetCents: 30250,
            taxRate: 20,
            materialCostCents: 12250,
            laborHours: 2,
            sortOrder: 0
          },
          {
            description: "Zusaetzliche Montagestunden",
            quantity: 2,
            unit: "Std.",
            unitPriceNetCents: 7500,
            taxRate: 20,
            laborHours: 2,
            sortOrder: 1
          }
        ]
      }
    }
  });

  await prisma.invoice.create({
    data: {
      userId,
      customerId: privat.id,
      quoteId: quoteDraft.id,
      number: demoNumber("RE", 2),
      status: "OPEN",
      taxMode: "STANDARD",
      invoiceDate: now,
      serviceDate: now,
      servicePeriod: "Gartenservice und Zaunreparatur",
      dueDate: currentDueDate,
      note: "Offene B2C-Demo-Rechnung mit normalem Zahlungsziel.",
      subtotalNetCents: 51530,
      taxTotalCents: 10306,
      totalGrossCents: 61836,
      lockedAt: now,
      items: {
        create: [
          {
            description: "Gartenzaun Reparaturpaket",
            quantity: 1,
            unit: "Pauschale",
            unitPriceNetCents: 51530,
            taxRate: 20,
            materialCostCents: 21830,
            laborHours: 4,
            sortOrder: 0
          }
        ]
      }
    }
  });

  await prisma.invoice.create({
    data: {
      userId,
      customerId: pension.id,
      number: demoNumber("RE", 3),
      status: "PAID",
      taxMode: "STANDARD",
      invoiceDate: addDays(now, -22),
      serviceDate: addDays(now, -23),
      dueDate: addDays(now, -8),
      note: "Bezahlte Demo-Rechnung fuer erledigte Malerarbeiten.",
      subtotalNetCents: 41120,
      taxTotalCents: 8224,
      totalGrossCents: 49344,
      paidAt: addDays(now, -7),
      lockedAt: addDays(now, -22),
      items: {
        create: [
          {
            description: "Material und Arbeit Malerzimmer",
            quantity: 1,
            unit: "Pauschale",
            unitPriceNetCents: 41120,
            taxRate: 20,
            materialCostCents: 8320,
            laborHours: 5,
            sortOrder: 0
          }
        ]
      }
    }
  });

  await prisma.invoice.create({
    data: {
      userId,
      customerId: elektro.id,
      number: demoNumber("RE", 4),
      status: "DRAFT",
      taxMode: "REVERSE_CHARGE",
      invoiceDate: now,
      servicePeriod: "Projektvorbereitung Elektro",
      dueDate: futureDueDate,
      note: "Entwurfsrechnung: Reverse-Charge-Hinweis vor Versand noch fachlich pruefen.",
      subtotalNetCents: 96000,
      taxTotalCents: 0,
      totalGrossCents: 96000,
      items: {
        create: [
          {
            description: "Elektro-Unterverteilung vorbereiten",
            quantity: 12,
            unit: "Std.",
            unitPriceNetCents: 8000,
            taxRate: 20,
            laborHours: 12,
            sortOrder: 0
          }
        ]
      }
    }
  });

  await prisma.invoice.create({
    data: {
      userId,
      customerId: bauhof.id,
      number: demoNumber("RE", 5),
      status: "CANCELLED",
      taxMode: "STANDARD",
      invoiceDate: addDays(now, -30),
      serviceDate: addDays(now, -30),
      dueDate: addDays(now, -16),
      note: "Stornierte Demo-Rechnung, damit der Status sichtbar getestet werden kann.",
      subtotalNetCents: 15000,
      taxTotalCents: 3000,
      totalGrossCents: 18000,
      lockedAt: addDays(now, -30),
      items: {
        create: [
          {
            description: "Falsch erfasste Anfahrtspauschale",
            quantity: 5,
            unit: "Pauschale",
            unitPriceNetCents: 3000,
            taxRate: 20,
            sortOrder: 0
          }
        ]
      }
    }
  });

  await prisma.numberSequence.createMany({
    data: [
      {
        userId,
        kind: "QUOTE",
        year: CURRENT_YEAR,
        prefix: "ANG",
        nextNumber: 5
      },
      {
        userId,
        kind: "INVOICE",
        year: CURRENT_YEAR,
        prefix: "RE",
        nextNumber: 6
      }
    ]
  });
}

export async function resetDemoData(userId: string): Promise<void> {
  await clearDemoData(userId);
  await seedDemoData(userId);
}

export async function ensureDemoData(userId: string): Promise<void> {
  const company = await prisma.companyProfile.findUnique({ where: { userId }, select: { id: true } });
  if (company) return;

  await seedDemoData(userId);
}
