import { Suspense } from "react";
import { getCatalog } from "@/lib/catalog/loader";
import { HomePageClient } from "@/components/HomePageClient";

async function CatalogPageContent() {
  const catalog = await getCatalog(false);
  return <HomePageClient products={catalog.products} />;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen flex items-center justify-center bg-[var(--bg-canvas)] font-mono text-xs text-[var(--ink-secondary)]">
          INITIALIZING CATALOG SYSTEM...
        </div>
      }
    >
      <CatalogPageContent />
    </Suspense>
  );
}
