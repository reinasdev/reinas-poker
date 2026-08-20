import { Coffee } from "lucide-react";

/** "café" vira ícone; qualquer outra carta é exibida como texto. */
export function VoteValue({ value }: { value: string }) {
  if (value.toLowerCase() === "café")
    return <Coffee size={16} aria-label="café" />;
  return <>{value}</>;
}
