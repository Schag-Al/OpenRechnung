const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
let cookieHeader = "";

function rememberCookies(response) {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return;

  cookieHeader = setCookie
    .split(",")
    .map((part) => part.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

function requestOptions(options = {}) {
  return {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {})
    }
  };
}

async function fetchText(path) {
  const response = await fetch(`${baseUrl}${path}`, requestOptions({ redirect: "manual" }));
  rememberCookies(response);
  const text = await response.text();
  return { response, text };
}

async function fetchPdf(path) {
  const response = await fetch(`${baseUrl}${path}`, requestOptions({ redirect: "manual" }));
  return {
    response,
    contentType: response.headers.get("content-type") ?? ""
  };
}

const results = [];

const publicDashboard = await fetchText("/dashboard");
results.push({
  name: "/dashboard public gate",
  ok: publicDashboard.response.status === 200 && publicDashboard.text.includes("Testdashboard oeffnen"),
  status: publicDashboard.response.status
});

const root = await fetchText("/");
results.push({
  name: "/ landing",
  ok: root.response.status === 200 && root.text.includes("OpenRechnung") && root.text.includes("Testdashboard oeffnen"),
  status: root.response.status
});

const demoStart = await fetchText("/testdashboard");
results.push({
  name: "/testdashboard redirect",
  ok: demoStart.response.status === 307 && demoStart.response.headers.get("location") === "/dashboard" && cookieHeader.includes("openrechnung_demo=true"),
  status: demoStart.response.status
});

const resetResponse = await fetch(`${baseUrl}/api/demo/reset`, requestOptions({ method: "POST", redirect: "manual" }));
results.push({
  name: "demo reset",
  ok: resetResponse.status === 200,
  status: resetResponse.status
});

const pageChecks = [
  ["/dashboard", "Tutorial starten"],
  ["/kunden", "Elektro Partner Projektbau KG"],
  ["/angebote", `ANG-${new Date().getFullYear()}-0002`],
  ["/rechnungen", `RE-${new Date().getFullYear()}-0001`],
  ["/kalkulation", "Gartenzaun Reparaturpaket"],
  ["/feedback", "Funktionsvorschlag einmelden"],
  ["/support", "OpenRechnung unterstuetzen"],
  ["/datenschutz", "Datenschutz"],
  ["/impressum", "Impressum"]
];

for (const [path, expected] of pageChecks) {
  const { response, text } = await fetchText(path);
  results.push({
    name: path,
    ok: response.status === 200 && text.includes(expected),
    status: response.status
  });
}

for (const path of ["/login", "/register"]) {
  const { response } = await fetchText(path);
  results.push({
    name: path,
    ok: response.status === 200,
    status: response.status
  });
}

const quotePage = await fetchText("/angebote");
const quoteMatch = [...quotePage.text.matchAll(new RegExp('href="/angebote/([^"]+)"', "g"))].find((match) => match[1] !== "neu");
const invoicePage = await fetchText("/rechnungen");
const invoiceMatch = [...invoicePage.text.matchAll(new RegExp('href="/rechnungen/([^"]+)"', "g"))].find((match) => match[1] !== "neu");

if (quoteMatch) {
  const preview = await fetchText(`/angebote/${quoteMatch[1]}/vorschau`);
  results.push({
    name: "quote preview",
    ok: preview.response.status === 200 && preview.text.includes("PDF-Vorschau"),
    status: preview.response.status
  });

  const pdf = await fetchPdf(`/api/quotes/${quoteMatch[1]}/pdf`);
  results.push({
    name: "quote pdf",
    ok: pdf.response.status === 200 && pdf.contentType.includes("application/pdf"),
    status: pdf.response.status
  });
} else {
  results.push({ name: "quote pdf", ok: false, status: "missing quote link" });
}

if (invoiceMatch) {
  const preview = await fetchText(`/rechnungen/${invoiceMatch[1]}/vorschau`);
  results.push({
    name: "invoice preview",
    ok: preview.response.status === 200 && preview.text.includes("PDF-Vorschau"),
    status: preview.response.status
  });

  const pdf = await fetchPdf(`/api/invoices/${invoiceMatch[1]}/pdf`);
  results.push({
    name: "invoice pdf",
    ok: pdf.response.status === 200 && pdf.contentType.includes("application/pdf"),
    status: pdf.response.status
  });
} else {
  results.push({ name: "invoice pdf", ok: false, status: "missing invoice link" });
}

for (const path of ["/api/export/customers", "/api/export/invoices"]) {
  const response = await fetch(`${baseUrl}${path}`, requestOptions({ redirect: "manual" }));
  results.push({
    name: `${path} csv`,
    ok: response.status === 200 && (response.headers.get("content-type") ?? "").includes("text/csv"),
    status: response.status
  });
}

for (const result of results) {
  console.log(`${result.ok ? "OK" : "FAIL"} ${result.name} (${result.status})`);
}

if (results.some((result) => !result.ok)) {
  process.exit(1);
}
