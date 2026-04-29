"use client";

import { useCallback, useEffect, useState } from "react";

type TourStep = {
  selector: string;
  title: string;
  description: string;
  placement?: "top" | "bottom";
};

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
};

const sessionKey = "openrechnung-dashboard-tutorial-seen-v1";
const highlightPadding = 8;
const bubbleWidth = 360;

const steps: TourStep[] = [
  {
    selector: '[data-tour="dashboard-header"]',
    title: "Willkommen im Testkonto",
    description:
      "Das ist die Hauptseite. Hier sehen Sie auf einen Blick offene Rechnungen, wichtige Hinweise und die letzten Dokumente. Im Testmodus sind bereits Beispieldaten geladen."
  },
  {
    selector: '[data-tour="nav-firma"]',
    title: "Firmendaten",
    description:
      "Hier hinterlegen Sie Firmenadresse, Bankverbindung, Standard-Zahlungsziel, Steuerdaten und Texte fuer Ihre PDFs. Diese Daten werden in Angebote und Rechnungen uebernommen."
  },
  {
    selector: '[data-tour="nav-kunden"]',
    title: "Kunden",
    description:
      "Hier koennen Sie die Daten Ihrer Kunden anlegen und spaeter bei Rechnungen oder Angeboten verwenden. Sie koennen Kundendaten dort aber auch direkt manuell hinzufuegen."
  },
  {
    selector: '[data-tour="nav-kalkulation"]',
    title: "Artikel & Leistungen",
    description:
      "Hier sammeln Sie haeufige Leistungen, Material und Kalkulationen. So muessen Sie typische Positionen nicht jedes Mal neu schreiben."
  },
  {
    selector: '[data-tour="new-quote"]',
    title: "Neues Angebot",
    description:
      "Damit erstellen Sie ein Angebot mit Kunde, Positionen, Steuerfall und PDF-Vorschau. Angenommene Angebote koennen spaeter in Rechnungen umgewandelt werden."
  },
  {
    selector: '[data-tour="new-invoice"]',
    title: "Neue Rechnung",
    description:
      "Hier schreiben Sie direkt eine Rechnung. Zahlungsziel, Bankdaten und Texte kommen aus den Firmeneinstellungen, lassen sich aber im Dokument passend ergaenzen."
  },
  {
    selector: '[data-tour="dashboard-stats"]',
    title: "Wichtige Zahlen",
    description:
      "Diese Karten zeigen offene Rechnungen, die offene Summe und ueberfaellige Rechnungen. So sehen Sie sofort, wo Geld noch aussteht."
  },
  {
    selector: '[data-tour="attention-list"]',
    title: "Was braucht Aufmerksamkeit?",
    description:
      "Dieser Bereich zeigt Aufgaben, die Sie nicht uebersehen sollten, zum Beispiel ueberfaellige Rechnungen, Entwuerfe oder fehlende Firmendaten."
  },
  {
    selector: '[data-tour="recent-documents"]',
    title: "Letzte Dokumente",
    description:
      "Hier finden Sie Ihre zuletzt bearbeiteten Angebote und Rechnungen. Ein Klick oeffnet das jeweilige Dokument."
  },
  {
    selector: '[data-tour="support-feedback"]',
    title: "Unterstuetzen und Vorschlaege melden",
    description:
      "Rechts koennen Sie spaeter das Projekt freiwillig unterstuetzen und schon jetzt Funktionsvorschlaege einmelden. Im MVP gibt es noch keine Zahlungsfunktion."
  }
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getViewport() {
  if (typeof window === "undefined") {
    return { width: 1024, height: 768 };
  }

  return { width: window.innerWidth, height: window.innerHeight };
}

export function DashboardTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");

  const step = steps[currentStep];

  const measureTarget = useCallback(() => {
    const target = document.querySelector<HTMLElement>(step.selector);
    if (!target) {
      setHighlightRect(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    const viewport = getViewport();
    const top = clamp(rect.top - highlightPadding, 12, viewport.height - 24);
    const left = clamp(rect.left - highlightPadding, 12, viewport.width - 24);
    const right = clamp(rect.right + highlightPadding, 24, viewport.width - 12);
    const bottom = clamp(rect.bottom + highlightPadding, 24, viewport.height - 12);
    const nextRect = {
      top,
      left,
      width: Math.max(48, right - left),
      height: Math.max(40, bottom - top),
      bottom
    };
    const spaceBelow = viewport.height - nextRect.bottom;
    const spaceAbove = nextRect.top;

    setHighlightRect(nextRect);
    setPlacement(step.placement ?? (spaceBelow < 250 && spaceAbove > spaceBelow ? "top" : "bottom"));
  }, [step]);

  useEffect(() => {
    try {
      if (!window.sessionStorage.getItem(sessionKey)) {
        setIsOpen(true);
        window.sessionStorage.setItem(sessionKey, "true");
      }
    } catch {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const target = document.querySelector<HTMLElement>(step.selector);
    target?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

    const measureTimer = window.setTimeout(measureTarget, 280);
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);

    return () => {
      window.clearTimeout(measureTimer);
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget, true);
    };
  }, [isOpen, measureTarget, step.selector]);

  const openTutorial = () => {
    setCurrentStep(0);
    setIsOpen(true);
    window.setTimeout(measureTarget, 0);
  };

  const closeTutorial = () => {
    setIsOpen(false);
  };

  const goNext = () => {
    if (currentStep >= steps.length - 1) {
      closeTutorial();
      return;
    }

    setCurrentStep((value) => value + 1);
  };

  const goBack = () => {
    setCurrentStep((value) => Math.max(0, value - 1));
  };

  const viewport = getViewport();
  const bubbleActualWidth = Math.min(bubbleWidth, viewport.width - 32);
  const fallbackLeft = Math.max(16, (viewport.width - bubbleActualWidth) / 2);
  const bubbleLeft = highlightRect
    ? clamp(highlightRect.left + highlightRect.width / 2 - bubbleActualWidth / 2, 16, viewport.width - bubbleActualWidth - 16)
    : fallbackLeft;
  const estimatedBubbleHeight = 260;
  const bubbleTop = highlightRect
    ? placement === "bottom"
      ? clamp(highlightRect.bottom + 18, 16, viewport.height - estimatedBubbleHeight - 16)
      : clamp(highlightRect.top - estimatedBubbleHeight - 18, 16, viewport.height - estimatedBubbleHeight - 16)
    : Math.max(24, viewport.height / 2 - estimatedBubbleHeight / 2);
  const arrowLeft = highlightRect
    ? clamp(highlightRect.left + highlightRect.width / 2 - bubbleLeft - 8, 24, bubbleActualWidth - 32)
    : bubbleActualWidth / 2 - 8;

  return (
    <>
      <button
        type="button"
        onClick={openTutorial}
        className="mb-4 inline-flex items-center gap-2 rounded-xl border border-brand-clay/25 bg-white px-4 py-2 text-sm font-black text-brand-moss shadow-sm transition hover:border-brand-clay hover:bg-brand-sand"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-clay text-xs text-white">?</span>
        Tutorial starten
      </button>

      {isOpen ? (
        <div className="fixed inset-0" style={{ zIndex: 80 }} aria-live="polite">
          {highlightRect ? (
            <div
              className="pointer-events-none fixed rounded-2xl border-2 border-white bg-transparent ring-4 ring-brand-clay/80"
              style={{
                top: highlightRect.top,
                left: highlightRect.left,
                width: highlightRect.width,
                height: highlightRect.height,
                boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.66)"
              }}
            />
          ) : (
            <div className="fixed inset-0 bg-slate-950/70" />
          )}

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard-Tutorial"
            className="fixed rounded-2xl border border-slate-200 bg-white p-5 text-brand-ink shadow-2xl"
            style={{
              top: bubbleTop,
              left: bubbleLeft,
              width: bubbleActualWidth
            }}
          >
            <span
              className={`absolute h-4 w-4 rotate-45 border-slate-200 bg-white ${
                placement === "bottom" ? "-top-2 border-l border-t" : "-bottom-2 border-b border-r"
              }`}
              style={{ left: arrowLeft }}
            />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-wide text-brand-clay">
                Schritt {currentStep + 1} von {steps.length}
              </p>
              <h2 className="mt-2 text-xl font-black text-brand-ink">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>

              <div className="mt-5 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-brand-clay transition-all"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={closeTutorial} className="text-sm font-bold text-slate-500 hover:text-brand-ink">
                  Schliessen
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={currentStep === 0}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-brand-ink disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Zurueck
                  </button>
                  <button type="button" onClick={goNext} className="rounded-xl bg-brand-clay px-4 py-2 text-sm font-bold text-white hover:bg-brand-moss">
                    {currentStep === steps.length - 1 ? "Fertig" : "Weiter"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
