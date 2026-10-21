import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { limit } from "@/server/cuenta";
import { emitirTokenWs } from "@/server/realtime";

export const POST = route(async (req) => {
  const uid = await requireUser();
  limit(`ws-token:${uid}`, 30, 60_000);
  const { role } = await body(req, z.object({ role: z.enum(["gps", "map"]) }));
  return emitirTokenWs(uid, role);
});
