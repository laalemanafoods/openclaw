// Conversation state tracking across messages for multi-turn flows.

type ConsumerState =
  | { segment: "consumer" }
  | { segment: "consumer"; step: "asking_city" }
  | { segment: "consumer"; step: "asking_barrio"; city: string };

type B2BCollectingState = {
  segment: "b2b";
  step: "collecting";
};

type B2BDoneState = {
  segment: "b2b";
  step: "done";
};

type SessionState =
  | ConsumerState
  | { segment: "vendedor" }
  | { segment: "queja" }
  | B2BCollectingState
  | B2BDoneState
  | { segment: "unknown" };

const sessions = new Map<string, SessionState>();

export function getSession(senderId: string): SessionState {
  return sessions.get(senderId) ?? { segment: "unknown" };
}

export function setSession(senderId: string, state: SessionState): void {
  sessions.set(senderId, state);
}
