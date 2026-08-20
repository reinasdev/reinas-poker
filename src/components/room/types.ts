export type Projection = {
  room: {
    id: string;
    name: string;
    slug: string;
    style: string;
    status: string;
    accessCode?: string | null;
  };
  isAdmin: boolean;
  member: { id: string } | null;
  deck: readonly string[];
  tasks: Array<{
    id: string;
    title: string;
    link: string;
    status: string;
    finalResult?: string | null;
  }>;
  participants: Array<{
    id: string;
    name: string | null;
    hasVoted: boolean;
    vote?: string;
  }>;
  round: { status: string; sequence: number } | null;
  selectedVote?: string;
};

export type RoomCommand = Record<string, unknown> & { action: string };
