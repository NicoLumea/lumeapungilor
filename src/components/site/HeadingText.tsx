import { useContent, text } from "@/lib/content";
import { HEADINGS } from "@/lib/headings";

export function HeadingText({ id }: { id: string }) {
  const { data } = useContent();
  const fallback = HEADINGS.find((h) => h.id === id)?.fallback ?? "";
  return <>{text(data?.["headings"], id) ?? fallback}</>;
}
