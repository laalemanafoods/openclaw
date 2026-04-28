// Conversation state tracking across messages for multi-turn flows (B2B data collection).

type B2BCollectingState = {
  segment: "b2b";
  step: "collecting";
  data: Partial<{ nombre: string; telefono: string; negocio: string; ubicacion: string }>;
};

type B2BDoneState = {
  segment: "b2b";
  step: "done";
};

type SessionState =
  | { segment: "consumer" }
  | { segment: "vendedor" }
  | { segment: "queja" }
  | B2BCollectingState
  | B2BDoneState
  | { segment: "unknown" };

// In-memory store — resets on process restart. Sufficient for stateless Railway instances.
const sessions = new Map<string, SessionState>();

export function getSession(senderId: string): SessionState {
  return sessions.get(senderId) ?? { segment: "unknown" };
}

export function setSession(senderId: string, state: SessionState): void {
  sessions.set(senderId, state);
}
