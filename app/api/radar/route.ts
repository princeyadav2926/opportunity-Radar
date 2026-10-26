import { NextRequest } from "next/server";
import { runOpportunityRadarPipeline, RadarPipelineInput, PipelineProgressEvent } from "@/lib/radar-pipeline";



export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RadarPipelineInput;

    const { lookingFor = "", profile = "", category = "All" } = body;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        function emit(event: PipelineProgressEvent) {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        }

        try {
          await runOpportunityRadarPipeline(
            {
              lookingFor,
              profile,
              category,
            },
            emit
          );
        } catch (err: unknown) {
          console.error("[API /api/radar] Pipeline stream error:", err);
          // Error event already emitted in pipeline catch
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: unknown) {
    console.error("[API /api/radar] Handler error:", error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message || "Invalid request payload",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
