export type ActionState =
  | { status: "idle" }
  | { status: "success" | "error"; message: string; at: number };

export const success = (message: string): ActionState => ({ status: "success", message, at: Date.now() });
export const failure = (message: string): ActionState => ({ status: "error", message, at: Date.now() });
