import { supabase } from "./supabase";

export const PRO_PLAN_PRICE_FCFA = 3000;

export type MobileMoneyOperator = "mtn" | "airtel" | "orange" | "mpesa";

export const SUPPORTED_COUNTRIES = [
  { code: "+242", label: "Congo" },
  { code: "+237", label: "Cameroun" },
  { code: "+243", label: "RDC" },
  { code: "+241", label: "Gabon" },
  { code: "+225", label: "Côte d'Ivoire" },
] as const;

export const SUPPORTED_OPERATORS: { value: MobileMoneyOperator; label: string }[] = [
  { value: "mtn", label: "MTN Mobile Money" },
  { value: "airtel", label: "Airtel Money" },
  { value: "orange", label: "Orange Money" },
  { value: "mpesa", label: "M-Pesa" },
];

type InitiatePaymentInput = {
  familyId: string;
  countryCode: string;
  operator: MobileMoneyOperator;
  phone: string;
};

type InitiatePaymentResult = {
  error: string | null;
  message?: string;
};

/**
 * Lance un paiement Mobile Money direct (softpay) via SasPay. Contrairement
 * à une redirection vers une page hébergée, l'utilisateur reçoit une
 * invite de confirmation (USSD/PIN) directement sur son téléphone — la
 * confirmation finale arrive plus tard via le webhook `saspay-webhook`,
 * pas dans cette réponse.
 */
export async function initiateSaspayPayment(
  input: InitiatePaymentInput,
): Promise<InitiatePaymentResult> {
  const { data, error } = await supabase.functions.invoke<{
    pending?: boolean;
    message?: string;
    error?: string;
  }>("saspay-initialize", { body: input });

  if (error) {
    return { error: error.message || "Impossible de contacter SasPay." };
  }
  if (!data?.pending) {
    return { error: data?.error || "Réponse SasPay invalide." };
  }

  return { error: null, message: data.message };
}
