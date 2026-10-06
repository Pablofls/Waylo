export type TurnType = "recto" | "izquierda" | "derecha" | "llegada";

export interface NavStep {
  /** Fracción del recorrido (0-1) donde ocurre la maniobra. */
  at: number;
  turn: TurnType;
  text: string;
}

export interface NavAlert {
  from: number;
  to: number;
  title: string;
  text: string;
  tone: "orange" | "red";
}

export const navSteps: NavStep[] = [
  { at: 0.0, turn: "recto", text: "Sigue por Calle Ignacio Sepúlveda" },
  { at: 0.12, turn: "izquierda", text: "Gira a la izquierda en Av. Sendero" },
  { at: 0.35, turn: "recto", text: "Continúa por la ciclovía de Av. Sendero" },
  { at: 0.6, turn: "derecha", text: "Gira a la derecha en Paseo de los Leones" },
  { at: 0.85, turn: "derecha", text: "Entra por Av. Universidad a Ciudad Universitaria" },
  { at: 1.0, turn: "llegada", text: "Llegaste a UANL Ciudad Universitaria" },
];

export const navAlerts: NavAlert[] = [
  { from: 0.22, to: 0.32, title: "Bache a 150 m", text: "Carril derecho de Av. Sendero. Reportado hace 3 h.", tone: "orange" },
  { from: 0.62, to: 0.72, title: "Poca iluminación adelante", text: "Tramo de 300 m en Paseo de los Leones.", tone: "orange" },
];
