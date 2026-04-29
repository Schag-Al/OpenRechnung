import { randomBytes, pbkdf2Sync, timingSafeEqual, createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureDemoData } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";
import { isTestModeWithoutLogin, TEST_USER_EMAIL } from "@/lib/test-mode";

const SESSION_COOKIE = "handwerk_session";
export const DEMO_COOKIE = "openrechnung_demo";
const SESSION_DAYS = 30;
const PASSWORD_ITERATIONS = 310000;

export type AuthUser = {
  id: string;
  email: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function getOrCreateTestUser(): Promise<AuthUser> {
  const user = await prisma.user.upsert({
    where: { email: TEST_USER_EMAIL },
    create: {
      email: TEST_USER_EMAIL,
      passwordHash: "test-mode-without-login"
    },
    update: {},
    select: {
      id: true,
      email: true
    }
  });

  await ensureDemoData(user.id);

  return user;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, iterationsRaw, salt, hash] = storedHash.split("$");
  if (algorithm !== "pbkdf2_sha256" || !iterationsRaw || !salt || !hash) return false;

  const iterations = Number.parseInt(iterationsRaw, 10);
  const calculated = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const expected = Buffer.from(hash, "hex");

  return calculated.length === expected.length && timingSafeEqual(calculated, expected);
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt
    }
  });

  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(DEMO_COOKIE);
}

export async function activateDemoSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.set(DEMO_COOKIE, "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();

  if (isTestModeWithoutLogin() && cookieStore.get(DEMO_COOKIE)?.value === "true") {
    return getOrCreateTestUser();
  }

  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashToken(token),
      expiresAt: { gt: new Date() }
    },
    include: {
      user: {
        select: {
          id: true,
          email: true
        }
      }
    }
  });

  return session?.user ?? null;
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
