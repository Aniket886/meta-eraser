import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const { reports } = await req.json();

    // Build a concise summary for the AI
    const filesSummary = reports.map((r: any) => ({
      file: r.filename,
      type: r.type,
      sizeKB: (r.size / 1024).toFixed(1),
      removed: r.summary.removed,
      kept: r.summary.kept,
      removedFields: r.fields
        .filter((f: any) => f.status === "removed")
        .map((f: any) => f.name)
        .slice(0, 10),
    }));

    const totalRemoved = reports.reduce(
      (s: number, r: any) => s + r.summary.removed,
      0
    );
    const totalKept = reports.reduce(
      (s: number, r: any) => s + r.summary.kept,
      0
    );

    const prompt = `You are a cybersecurity and digital privacy expert. Analyze this metadata cleaning report and provide:

1. **Risk Assessment** (2-3 sentences): What privacy risks were mitigated by removing this metadata?
2. **Key Findings** (2-3 bullet points): Most notable metadata fields that were removed and why they matter.
3. **Recommendation** (1-2 sentences): Any additional steps the user should consider for privacy.

Data:
- Files processed: ${reports.length}
- Total fields removed: ${totalRemoved}
- Total fields kept: ${totalKept}
- File details: ${JSON.stringify(filesSummary)}

Keep the response concise and professional. Use plain text, no markdown headers.`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are a digital privacy and cybersecurity expert providing concise, actionable metadata audit insights.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const insights = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
