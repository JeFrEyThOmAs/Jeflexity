import type { NextFunction, Request, Response } from "express";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { createSupabaseClient } from "./client";
import { prisma } from "./db";

const client = createSupabaseClient();

function resolveAuthEmail(user: SupabaseAuthUser): string {
  if (user.email) return user.email;

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  if (meta && typeof meta.email === "string") return meta.email;
  if (meta && typeof meta.user_name === "string") {
    return `${meta.user_name}@users.noreply.github.com`;
  }
  if (meta && typeof meta.preferred_username === "string") {
    return `${meta.preferred_username}@users.noreply.github.com`;
  }

  for (const identity of user.identities ?? []) {
    const data = identity.identity_data as Record<string, unknown> | undefined;
    if (data && typeof data.email === "string") return data.email;
  }

  return `${user.id}@user.internal`;
}

function resolveDisplayName(user: SupabaseAuthUser, email: string): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fullName = meta?.full_name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  const name = meta?.name;
  if (typeof name === "string" && name.trim()) return name.trim();
  const userName = meta?.user_name ?? meta?.preferred_username;
  if (typeof userName === "string" && userName.trim()) return userName.trim();
  return email.includes("@") ? email.split("@")[0]! : email;
}

function resolveProvider(user: SupabaseAuthUser): "Google" | "Github" {
  const p = String(user.app_metadata?.provider ?? "").toLowerCase();
  return p === "google" ? "Google" : "Github";
}

export async function middleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : authHeader;

  if (!token) {
    res.status(401).json({ message: "Missing auth token" });
    return;
  }

  const { data, error } = await client.auth.getUser(token);

  if (error) {
    console.error("Supabase auth.getUser:", error.message);
    res.status(401).json({ message: "Invalid or expired session", detail: error.message });
    return;
  }

  const user = data.user;
  if (!user?.id) {
    res.status(401).json({ message: "Invalid or expired session" });
    return;
  }

  const email = resolveAuthEmail(user);
  const name = resolveDisplayName(user, email);

  try {
    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        supabaseId: user.id,
        email,
        provider: resolveProvider(user),
        name,
      },
      update: {
        supabaseId: user.id,
        email,
        name,
        provider: resolveProvider(user),
      },
    });
  } catch (e) {
    console.log(e);
  }

  req.userId = user.id;
  next();
}
