import { route } from "@/server/api";
import { closeSession } from "@/server/session";

export const POST = route(async () => {
  await closeSession();
});
