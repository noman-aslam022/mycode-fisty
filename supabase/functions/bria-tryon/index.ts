import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TryOnRequestBody {
  personImage: string;
  garmentImages: string[];
  instruction?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { personImage, garmentImages, maskImage, instruction }: TryOnRequestBody & { maskImage?: string } = await req.json();

    if (!personImage || !garmentImages || garmentImages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Both a person image and at least one garment image are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const BRIA_API_KEY = Deno.env.get("BRIA_API_KEY");
    if (!BRIA_API_KEY) {
      return new Response(
        JSON.stringify({ error: "BRIA_API_KEY is not configured in Supabase secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strict identity & appearance preservation lock
    const identityLock =
      "CRITICAL: Keep the person's exact face, facial features, eyes, nose, lips, jawline, skin tone, skin complexion, hair, hairstyle, body shape, body proportions, posture, pose, hands, and background 100% identical and unchanged from the source photo. Do NOT redraw, alter, or replace the person's face or physical appearance. Only swap and drape the specified clothing onto the body.";

    const finalPrompt = instruction ? `${instruction} ${identityLock}` : identityLock;

    // Bria API strictly requires raw Base64 bytes without data:image/...;base64, prefix
    const cleanImageInput = (input: string) => {
      if (!input) return input;
      if (input.startsWith("data:")) {
        const comma = input.indexOf(",");
        if (comma !== -1) return input.slice(comma + 1);
      }
      return input;
    };

    // Call Bria Virtual Try-On API (FIBO-Edit-1.5 / VTO endpoint)
    // Note: Bria accepts image, mask (optional), reference_images (1-3), and prompt
    const briaResponse = await fetch("https://engine.prod.bria-api.com/v1/fibo/edit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api_token": BRIA_API_KEY,
      },
      body: JSON.stringify({
        image: cleanImageInput(personImage),
        ...(maskImage ? { mask: cleanImageInput(maskImage) } : {}),
        reference_images: garmentImages.slice(0, 3).map(cleanImageInput),
        prompt: finalPrompt,
      }),
    });

    const briaData = await briaResponse.json();

    if (!briaResponse.ok) {
      const errorMsg = briaData?.error || briaData?.message || `Bria API error (${briaResponse.status})`;
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: briaResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If Bria returns an async job with request_id / status_url, poll for completion
    let resultUrl = briaData?.result_url || briaData?.image_url || briaData?.imageUrl || null;

    if (!resultUrl && (briaData?.status_url || briaData?.request_id)) {
      const pollUrl = briaData.status_url || `https://engine.prod.bria-api.com/v1/status/${briaData.request_id}`;
      const maxAttempts = 30;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await fetch(pollUrl, {
          headers: { "api_token": BRIA_API_KEY },
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.status === "COMPLETED" || statusData.status === "success") {
            resultUrl = statusData.result_url || statusData.image_url || statusData.imageUrl;
            break;
          }
          if (statusData.status === "FAILED" || statusData.status === "error") {
            throw new Error(statusData.error || "Try-on generation failed on Bria.");
          }
        }
      }
    }

    if (!resultUrl) {
      return new Response(
        JSON.stringify({ error: "No image was returned from Bria. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl: resultUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal try-on error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
