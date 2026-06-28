import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMugHot } from "@fortawesome/free-solid-svg-icons";

export function VoteValue({ value }: { value: string }) {
  if (value.toLowerCase() === "café")
    return <FontAwesomeIcon icon={faMugHot} aria-label="café" title="café" />;
  return value;
}
