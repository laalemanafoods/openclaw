// Conversation state tracking across messages for multi-turn flows.

type ConsumerState =
  | { segment: "consumer" }
  | { segment: "consumer"; step: "asking_city" }
  | { segment: "consumer"; step: "asking_barrio"; city: string }
  | { segment: "consumer"; step: "asking_city_for_barrio"; barrio: string }
  | { segment: "consumer"; step: "disambiguating_b2b" };

type B2BState =
  | { segment: "b2b"; step: "collecting" }
  | { segment: "b2b"; step: "done" };

type EventoState =
  | { segment: "evento"; step: "confirming" }
  | { segment: "evento"; step: "collecting" }
  | { segment: "evento"; step: "done" };

type ConfusionState =
  | { segment: "confusion"; step: "asking" }
  | { segment: "confusion"; step: "collecting" }
  | { segment: "confusion"; step: "done" };

type QuejaState =
  | { segment: "queja"; step: "collecting" }
  | { segment: "queja"; step: "done" };

type SessionState =
  | ConsumerState
  | B2BState
  | EventoState
  | QuejaState
  | ConfusionState
  | { segment: "vendedor" }
  | { segment: "unknown" };

const sessions = new Map<string, SessionState>();
const confusionCounts = new Map<string, number>();
const staffSenders = new Set<string>();

export function getSession(senderId: string): SessionState {
  return sessions.get(senderId) ?? { segment: "unknown" };
}

export function setSession(senderId: string, state: SessionState): void {
  sessions.set(senderId, state);
}

export function incrementConfusion(senderId: string): number {
  const count = (confusionCounts.get(senderId) ?? 0) + 1;
  confusionCounts.set(senderId, count);
  return count;
}

export function resetConfusion(senderId: string): void {
  confusionCounts.delete(senderId);
}

export function markAsStaff(senderId: string): void {
  staffSenders.add(senderId);
}

export function isStaff(senderId: string): boolean {
  return staffSenders.has(senderId);
}
