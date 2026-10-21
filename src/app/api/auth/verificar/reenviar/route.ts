import { requireUser, route } from "@/server/api";
import { limit, sendVerificationCode } from "@/server/cuenta";

export const POST = route(async () => {
  const uid = await requireUser();
  limit(`reenvio:${uid}`, 3, 60 * 60_000);
  await sendVerificationCode(uid);
});
