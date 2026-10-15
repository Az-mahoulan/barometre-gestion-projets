// Réveil du serveur Django de démonstration.
// Sur l'offre gratuite de Render, un service endormi ne se réveille que sur une visite venue d'Internet :
// les appels relayés par ce serveur Next ne suffisent pas. Le navigateur suit donc cette redirection
// vers la sonde de santé publique de Django, ce qui le réveille.
import { connection } from "next/server";

export async function GET() {
  await connection(); // lit BACKEND_URL à chaque appel, pas au moment de la construction
  const backend = (process.env.BACKEND_URL ?? "").replace(/\/$/, "");
  if (!backend) return new Response(null, { status: 204 });
  const target = /^https?:\/\//.test(backend) ? backend : `http://${backend}`;
  return Response.redirect(new URL("/api/v1/health/", target), 307);
}
