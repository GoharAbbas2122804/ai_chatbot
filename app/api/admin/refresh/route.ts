import { NextResponse } from "next/server";
import crypto from "crypto";
import { getCatalog } from "@/lib/catalog/loader";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Constant-time comparison to prevent timing attacks on administrative tokens.
 */
function secureCompare(inputToken: string | null | undefined, expectedToken: string): boolean {
  if (!inputToken || typeof inputToken !== "string") {
    return false;
  }

  const inputBuffer = Buffer.from(inputToken);
  const expectedBuffer = Buffer.from(expectedToken);

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuffer, expectedBuffer);
}

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-token");

  if (!secureCompare(token, env.ADMIN_TOKEN)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or missing administrative token" } },
      { status: 401 }
    );
  }

  try {
    const freshCatalog = await getCatalog(true);
    return NextResponse.json(
      {
        ok: true,
        count: freshCatalog.count,
        version: freshCatalog.version,
        loadedAt: freshCatalog.loadedAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reload catalog";
    return NextResponse.json(
      { error: { code: "CATALOG_RELOAD_FAILED", message } },
      { status: 503 }
    );
  }
}
