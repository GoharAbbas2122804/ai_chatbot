import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog/loader";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await getCatalog(false);
    const ageSeconds = Math.max(0, Math.floor((Date.now() - catalog.loadedAt.getTime()) / 1000));

    return NextResponse.json(
      {
        status: "ok",
        count: catalog.count,
        version: catalog.version,
        loadedAt: catalog.loadedAt.toISOString(),
        ageSeconds,
        model: env.LLM_MODEL,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Catalog unavailable";
    return NextResponse.json(
      {
        status: "degraded",
        error: message,
        model: env.LLM_MODEL,
      },
      { status: 503 }
    );
  }
}
