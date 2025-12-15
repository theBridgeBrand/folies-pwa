import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload = await req.json();
    console.log("PayGreen callback payload:", payload);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const userId = payload.metadata?.user_id;
    const action = payload.metadata?.action;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing user_id in metadata" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "register_card" && payload.status === "SUCCESSED") {
      const instrumentId = payload.data?.instrumentId || payload.instrumentId;
      const last4 = payload.data?.card?.last4 || payload.card?.last4 || "0000";
      const cardType = payload.data?.card?.brand || payload.card?.brand || "restaurant";

      const { error: updateError } = await supabase
        .from("users")
        .update({
          paygreen_card_id: instrumentId,
          paygreen_card_last4: last4,
          paygreen_card_type: cardType,
          default_payment_method: "paygreen",
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating user:", updateError);
        throw updateError;
      }

      const redirectUrl = `${Deno.env.get("SUPABASE_URL")?.replace(
        "https://",
        "https://"
      )}/profile?card_registered=true`;

      return new Response(
        `<html><head><meta http-equiv="refresh" content="0; url=${redirectUrl}"></head><body>Carte enregistrée avec succès. Redirection...</body></html>`,
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/html" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Callback received" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in paygreen-card-callback:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});