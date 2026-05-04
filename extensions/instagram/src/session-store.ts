// Conversation state tracking across messages for multi-turn flows.

type ConsumerState =
  | { segment: "consumer" }
  | { segment: "consumer"; step: "asking_city" }
  | { segment: "consumer"; step: "asking_barrio"; city: string };

type B2BState =
  | { segment: "b2b"; step: "collecting" }
  | { segment: "b2b"; step: "done" };

type QuejaState =
  | { segment: "queja"; step: "collecting" }
  | { segment: "queja"; step: "done" };

type SessionState =
  | ConsumerState
  | B2BState
  | QuejaState
  | { segment: "vendedor" }
  | { segment: "unknown" };

const sessions = new Map<string, SessionState>();

export function getSession(senderId: string): SessionState {
  return sessions.get(senderId) ?? { segment: "unknown" };
}

export function setSession(senderId: string, state: SessionState): void {
  sessions.set(senderId, state);
}
