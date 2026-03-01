import { destroyCreatorSession } from "@/lib/session";
import { jsonOk } from "@/lib/http";

export async function POST() {
  await destroyCreatorSession();
  return jsonOk({ ok: true });
}
