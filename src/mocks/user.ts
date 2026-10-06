import type { User } from "@/types";

export const mockUser: User = {
  id: "u_001",
  name: "Daniela Garza",
  age: 22,
  occupation: "Estudiante de la UDEM",
  city: "San Pedro Garza García",
  email: "daniela.garza@correo.com",
  vehicle: "bicicleta",
  mainUse: "transporte",
  routePreference: 70,
  maxExtraMinutes: 10,
  notifications: { alertas: true, municipio: true, rodadas: false },
  memberSince: "2026-03-14",
};
