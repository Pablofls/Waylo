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
  { at: 0.0, turn: "recto", text: "Sal de casa y sigue por la calle principal" },
  { at: 0.12, turn: "izquierda", text: "Gira a la izquierda hacia la ciclovía" },
  { at: 0.35, turn: "recto", text: "Continúa por la ciclovía" },
  { at: 0.6, turn: "derecha", text: "Gira a la derecha hacia la UDEM" },
  { at: 0.85, turn: "derecha", text: "Entra por Av. Morones Prieto al campus" },
  { at: 1.0, turn: "llegada", text: "Llegaste a la UDEM" },
];

export const navAlerts: NavAlert[] = [
  { from: 0.22, to: 0.32, title: "Bache a 150 m", text: "Carril derecho de la calle principal. Reportado hace 3 h.", tone: "orange" },
  { from: 0.62, to: 0.72, title: "Poca iluminación adelante", text: "Tramo de 300 m antes de llegar a la UDEM.", tone: "orange" },
];
