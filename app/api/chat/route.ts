import { createDataStreamResponse, formatDataStreamPart } from "ai";
import { queryCatalogDeterministic } from "@/lib/catalog-data";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages?.[messages.length - 1];
    const userPrompt = lastMessage?.content || "";

    const catalogResult = queryCatalogDeterministic(userPrompt);

    return createDataStreamResponse({
      execute: async (dataStream) => {
        // Send technical metadata telemetry part
        dataStream.writeData({
          status: catalogResult.status,
          latencyMs: catalogResult.latencyMs,
          confidence: catalogResult.confidence,
          referencedSkus: catalogResult.referencedSkus,
          headline: catalogResult.headline,
        });

        const fullResponse = `${catalogResult.headline}\n\n${catalogResult.text}`;

        // Stream words smoothly for soft typewriter cadence
        const words = fullResponse.split(" ");
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? "" : " ") + words[i];
          dataStream.write(formatDataStreamPart("text", chunk));
          // 16ms delay between tokens for natural high-speed typewriter cadence
          await new Promise((resolve) => setTimeout(resolve, 16));
        }
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal catalog indexer communication failure",
        details: String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
