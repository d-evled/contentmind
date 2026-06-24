import type { ToolCall, ToolName } from "./types";

export type ToolCardEvent =
  | { type: "invoke"; args: unknown }
  | { type: "resolve"; result: unknown }
  | { type: "fail"; error: string };

export function initialToolCard(name: ToolName): ToolCall {
  return { id: crypto.randomUUID(), name, status: "pending", args: undefined };
}

export function toolCardReducer(state: ToolCall, event: ToolCardEvent): ToolCall {
  switch (event.type) {
    case "invoke":
      if (state.status !== "pending") return state;
      return { ...state, status: "running", args: event.args };
    case "resolve":
      if (state.status !== "running") return state;
      return { ...state, status: "result", result: event.result };
    case "fail":
      if (state.status !== "running") return state;
      return { ...state, status: "error", error: event.error };
    default:
      return state;
  }
}
