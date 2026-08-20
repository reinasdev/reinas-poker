export const DECKS = {
  SCRUM: ["0", "1/2", "1", "2", "3", "5", "8", "13", "?", "café"],
  FIBONACCI: ["1", "2", "3", "5", "8", "13", "21", "?", "café"],
  TSHIRT: ["PP", "P", "M", "G", "GG", "XG", "?", "café"],
} as const;
export type VotingStyle = keyof typeof DECKS;
export function isValidVote(style: VotingStyle, value: string) {
  return (DECKS[style] as readonly string[]).includes(value);
}
