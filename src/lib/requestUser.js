import { createHash } from "crypto";
import prisma from "@/lib/prisma";

const DEFAULT_USERNAME = "니혼고마스터";
const MAX_USERNAME_LENGTH = 40;

function decodeHeaderValue(value) {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getRequestProfile(request) {
  const rawUsername = decodeHeaderValue(request.headers.get("x-nihongo-username"));
  const baseUsername = rawUsername
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, MAX_USERNAME_LENGTH) || DEFAULT_USERNAME;
  const targetLevel = request.headers.get("x-nihongo-target-level") === "BEGINNER"
    ? "BEGINNER"
    : "N1";

  return {
    targetLevel,
    username: targetLevel === "BEGINNER" ? `${baseUsername}-beginner` : baseUsername
  };
}

export async function getOrCreateRequestUser(request, db = prisma) {
  const profile = getRequestProfile(request);
  const emailKey = createHash("sha256").update(profile.username).digest("hex").slice(0, 24);
  const user = await db.user.upsert({
    where: { username: profile.username },
    update: {},
    create: {
      email: `profile-${emailKey}@learning.local`,
      username: profile.username,
      points: 0
    }
  });

  return { ...profile, user };
}
