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
    const { user_id, fridge_id, card_id } = await req.json();

    if (!user_id || !fridge_id || !card_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const paygreenApiKey = Deno.env.get("PAYGREEN_API_KEY");
    const paygreenShopId = Deno.env.get("PAYGREEN_SHOP_ID");

    if (!paygreenApiKey || !paygreenShopId) {
      return new Response(
        JSON.stringify({ error: "PayGreen configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: unlockCodeData } = await supabase.rpc("generate_unlock_code");
    const unlockCode = unlockCodeData || Math.floor(Math.random() * 1000000).toString().padStart(6, "0");

    const paygreenResponse = await fetch(
      `https://api.paygreen.fr/api/2.0/payins/transaction/cash`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paygreenApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopId: paygreenShopId,
          amount: 0,
          currency: "EUR",
          orderId: `UNLOCK_${user_id}_${Date.now()}`,
          instrumentId: card_id,
          metadata: {
            user_id: user_id,
            fridge_id: fridge_id,
            unlock_code: unlockCode,
            action: "unlock",
          },
        }),
      }
    );

    const paygreenData = await paygreenResponse.json();

    if (!paygreenResponse.ok) {
      console.error("PayGreen payment error:", paygreenData);
      return new Response(
        JSON.stringify({
          error: "Erreur lors du paiement PayGreen",
          details: paygreenData,
        }),
        {
          status: paygreenResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user_id,
        fridge_id: fridge_id,
        dish_id: null,
        quantity: 0,
        unit_price: 0,
        total_amount: 0,
        payment_method: "paygreen",
        payment_status: "completed",
        payment_ref: paygreenData.data?.id || paygreenData.id,
        unlock_code: unlockCode,
        is_collected: false,
        collected_at: null,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Database error:", orderError);
      throw orderError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        unlock_code: unlockCode,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in paygreen-unlock:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});