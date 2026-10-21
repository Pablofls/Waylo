import { body, requireUser, route } from "@/server/api";
import { comparticionInput, detenerComparticion, iniciarComparticion, quienComparteConmigo } from "@/server/mapas";

export const GET = route(async () => ({ comparten: (await quienComparteConmigo(await requireUser())).map((s) => ({ id: s.id, name: s.name })) }));

export const POST = route(async (req) => {
  const uid = await requireUser();
  await iniciarComparticion(uid, await body(req, comparticionInput));
});

export const DELETE = route(async () => {
  await detenerComparticion(await requireUser());
});
