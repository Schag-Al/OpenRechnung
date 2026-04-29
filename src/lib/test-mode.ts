export const TEST_USER_EMAIL = "demo@openrechnung.local";

export function isTestModeWithoutLogin(): boolean {
  return process.env.TEST_MODE_WITHOUT_LOGIN === "true";
}
