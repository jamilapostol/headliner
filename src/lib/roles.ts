export const INVITABLE_ROLES = ["manager", "agent", "tour_manager", "merch", "accountant", "assistant"] as const;

export const ROLE_LABEL: Record<string, string> = {
  artist: "Artist",
  manager: "Manager",
  agent: "Agent",
  tour_manager: "Tour Manager",
  merch: "Merch",
  accountant: "Accountant",
  assistant: "Assistant",
};

// Roles allowed to invite/remove team members and manage billing.
export const TEAM_MANAGER_ROLES = ["artist", "manager"];

export const SEAT_LIMITS: Record<string, number> = { free: 1, pro: 1, touring: 3, team: 10 };
