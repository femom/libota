// Supabase Edge Function — supabase/functions/saspay-initialize/index.ts
//
// Initie un paiement Mobile Money direct ("softpay") via SasPay : le
// client fournit son opérateur et son numéro, SasPay envoie une
// invite USSD/PIN sur son téléphone. Le statut final (succès/échec)
// arrive plus tard via `saspay-webhook`, pas dans cette réponse.
//
// ⚠️ À VÉRIFIER avant mise en prod (mêmes réserves que le webhook) :
// l'URL exacte de l'endpoint softpay, le nom des champs attendus par
// SasPay (`operator`/`provider`, `phone`/`msisdn`, etc.) et le format
// de réponse. Construit par analogie avec le pattern commun à ces
// agrégateurs (DEXPAY, KPay...) — à ajuster contre
// https://docs.saspay.me/api-reference/payments une fois consultée.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SASPAY_SECRET_KEY = Deno.env.get("SASPAY_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const PRO_PLAN_AMOUNT_FCFA = 3000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Operator = "mtn" | "airtel" | "orange" | "mpesa";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }
  if (!SASPAY_SECRET_KEY) {
    console.error("SASPAY_SECRET_KEY manquant côté serveur.");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  let body: {
    familyId?: string;
    countryCode?: string;
    operator?: Operator;
    phone?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON invalide" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { familyId, countryCode, operator, phone } = body;
  if (!familyId || !countryCode || !operator || !phone) {
    return new Response(
      JSON.stringify({ error: "familyId, countryCode, operator et phone sont requis." }),
      { status: 400, headers: corsHeaders },
    );
  }

  const { data: isAdmin, error: adminCheckError } = await supabase.rpc(
    "is_family_admin",
    { target_family_id: familyId },
  );
  if (adminCheckError || !isAdmin) {
    return new Response(
      JSON.stringify({ error: "Seul l'Admin de cette famille peut souscrire." }),
      { status: 403, headers: corsHeaders },
    );
  }

  const fullPhone = `${countryCode}${phone.replace(/[^0-9]/g, "")}`;

  const saspayResponse = await fetch("https://api.saspay.me/v1/softpay", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SASPAY_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: PRO_PLAN_AMOUNT_FCFA,
      currency: "XAF",
      operator,
      phone: fullPhone,
      reference: `libota-${familyId}-${Date.now()}`,
      metadata: { family_id: familyId, user_id: user.id },
    }),
  });

  const saspayData = await saspayResponse.json();

  if (!saspayResponse.ok) {
    console.error("Erreur SasPay :", JSON.stringify(saspayData));
    return new Response(
      JSON.stringify({
        error:
          saspayData?.message ||
          "Impossible d'initier le paiement SasPay. Vérifiez le numéro et réessayez.",
      }),
      { status: 502, headers: corsHeaders },
    );
  }

  return new Response(
    JSON.stringify({
      pending: true,
      reference: saspayData?.reference ?? saspayData?.data?.reference ?? null,
      message:
        "Confirmez le paiement sur votre téléphone (code PIN Mobile Money). Le plan Pro s'activera automatiquement dès la confirmation.",
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
