// Supabase Edge Function — supabase/functions/saspay-webhook/index.ts
//
// Reçoit les notifications de statut de paiement SasPay (Mobile Money
// MTN / Airtel / Orange / carte) et met à jour le plan de la famille
// concernée quand un paiement est confirmé.
//
// ⚠️ À VÉRIFIER avant mise en prod — je n'ai pas pu récupérer la page
// exacte https://docs.saspay.me/api-reference/webhooks (mes
// recherches n'ont remonté que d'autres prestataires). Ce fichier est
// construit sur le pattern standard de ce type d'agrégateur africain
// (Paystack, Flutterwave, DEXPAY...) : signature HMAC hex-encodée
// dans un en-tête `x-*-signature`, payload JSON avec un champ de
// statut et les métadonnées transmises à l'initialisation. Trois
// points précis à confirmer/ajuster contre le vrai tableau de bord
// SasPay :
//   1. Le NOM exact de l'en-tête de signature (ex. `x-saspay-signature`
//      ci-dessous est une supposition).
//   2. L'algorithme exact (HMAC SHA-256 supposé ci-dessous ; Paystack
//      utilise SHA-512, d'autres du SHA-256 — à confirmer).
//   3. Le nom du champ de statut "paiement confirmé" dans le payload
//      (`status === "success"` supposé ci-dessous) et l'emplacement
//      des métadonnées (`data.metadata.family_id` supposé, par analogie
//      avec le webhook Paystack déjà écrit pour ce projet).
//
// Secrets requis (`supabase secrets set`) :
//   SASPAY_SECRET_KEY        — clé secrète SasPay
//   SUPABASE_URL             — auto-injectée
//   SUPABASE_SERVICE_ROLE_KEY — auto-injectée

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SASPAY_SECRET_KEY = Deno.env.get("SASPAY_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** HMAC SHA-256 hex-encodé. ⚠️ Algorithme à confirmer contre la doc SasPay. */
async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Corps BRUT pour la vérification de signature (ne pas parser puis
  // re-sérialiser : la chaîne exacte doit être préservée).
  const rawBody = await req.text();

  // ⚠️ Nom d'en-tête à confirmer contre le dashboard SasPay.
  const signature = req.headers.get("x-saspay-signature") ?? "";

  if (!SASPAY_SECRET_KEY) {
    console.error("SASPAY_SECRET_KEY manquant côté serveur.");
    return new Response("Server misconfigured", { status: 500 });
  }

  const expectedSignature = await hmacSha256Hex(SASPAY_SECRET_KEY, rawBody);
  if (expectedSignature !== signature) {
    console.error("Signature SasPay invalide — webhook ignoré.");
    return new Response("Invalid signature", { status: 401 });
  }

  let event: {
    status?: string;
    event?: string;
    data?: {
      metadata?: { family_id?: string };
      status?: string;
      reference?: string;
      customer?: { phone?: string };
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // ⚠️ Valeur exacte du statut "succès" à confirmer (ici on accepte les
  // variantes les plus probables pour limiter le risque si le nom
  // diffère légèrement de la doc réelle).
  const status = (event.data?.status ?? event.status ?? "").toLowerCase();
  const isSuccess = ["success", "successful", "completed", "paid"].includes(status);

  if (!isSuccess) {
    return new Response("Ignored (not a successful payment)", { status: 200 });
  }

  const familyId = event.data?.metadata?.family_id;
  if (!familyId) {
    console.error("Paiement confirmé reçu sans metadata.family_id — ignoré.");
    return new Response("Missing family_id in metadata", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: family, error: fetchError } = await supabase
    .from("families")
    .select("subscription_end_date")
    .eq("id", familyId)
    .maybeSingle();

  if (fetchError) {
    console.error("Erreur lecture famille :", fetchError.message);
    return new Response("Database error", { status: 500 });
  }
  if (!family) {
    console.error("Famille introuvable pour family_id :", familyId);
    return new Response("Family not found", { status: 404 });
  }

  const now = Date.now();
  const currentEnd = family.subscription_end_date
    ? new Date(family.subscription_end_date as string).getTime()
    : 0;
  const base = currentEnd > now ? currentEnd : now;
  const newEndDate = new Date(base + THIRTY_DAYS_MS).toISOString();

  const { error: updateError } = await supabase
    .from("families")
    .update({
      plan_type: "pro",
      subscription_status: "active",
      subscription_end_date: newEndDate,
    })
    .eq("id", familyId);

  if (updateError) {
    console.error("Erreur mise à jour famille :", updateError.message);
    return new Response("Database update failed", { status: 500 });
  }

  console.log(
    `Famille ${familyId} passée en Pro jusqu'au ${newEndDate} (réf. ${event.data?.reference ?? "?"}).`,
  );

  return new Response("OK", { status: 200 });
});
