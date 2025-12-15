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
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { user_id } = requestBody;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const paygreenApiKey = Deno.env.get("PAYGREEN_API_KEY");
    const paygreenShopId = Deno.env.get("PAYGREEN_SHOP_ID");

    if (!paygreenApiKey || !paygreenShopId) {
      return new Response(
        JSON.stringify({
          error: "PayGreen n'est pas encore configuré. Veuillez ajouter vos clés API PayGreen dans la configuration Supabase.",
          config_needed: true
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: "Utilisateur non trouvé" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let paygreenData;
    try {
      const paygreenResponse = await fetch(
        `https://api.paygreen.fr/api/${paygreenShopId}/payins/cardprint`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${paygreenApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: `CARD_REG_${user_id}_${Date.now()}`,
            returned_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/paygreen-card-callback`,
            notified_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/paygreen-card-callback`,
            buyer: {
              email: userData.email,
            },
          }),
        }
      );

      if (!paygreenResponse.ok) {
        const errorText = await paygreenResponse.text();
        console.error("PayGreen API error:", errorText);
        return new Response(
          JSON.stringify({
            error: "Erreur lors de la communication avec PayGreen",
            details: errorText,
          }),
          {
            status: paygreenResponse.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      paygreenData = await paygreenResponse.json();
    } catch (fetchError) {
      console.error("PayGreen fetch error:", fetchError);
      return new Response(
        JSON.stringify({
          error: "Impossible de contacter l'API PayGreen",
          details: fetchError.message,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        redirect_url: paygreenData.data?.url || paygreenData.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in paygreen-register-card:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});