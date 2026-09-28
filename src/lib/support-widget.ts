export const SUPPORT_TOPICS = {
  order: "Am o întrebare despre o comandă",
  product: "Am o întrebare despre un produs",
  return: "Retur sau reclamație",
  other: "Altă întrebare",
} as const;

export type SupportTopic = keyof typeof SUPPORT_TOPICS;

export type SupportContext = {
  route: string;
  product?: { id: string; name: string } | null;
  order?: { id: string; number: string } | null;
  guestOrderNumber?: string | null;
};

export type StoredSupportMessage = {
  id: string;
  role: "customer" | "team";
  text: string;
  createdAt: string;
};

export function supportSubject(topic: SupportTopic | null): string {
  return `Widget suport — ${topic ? SUPPORT_TOPICS[topic] : "Mesaj general"}`;
}

export function supportMessageBody(message: string, context: SupportContext): string {
  const contextLines = [`Pagină: ${context.route}`];

  if (context.product) {
    contextLines.push(`Produs: ${context.product.name} (${context.product.id})`);
  }
  if (context.order) {
    contextLines.push(`Comandă selectată: ${context.order.number} (${context.order.id})`);
  } else if (context.guestOrderNumber?.trim()) {
    contextLines.push(`Număr comandă declarat de client: ${context.guestOrderNumber.trim()}`);
  }

  return `${message.trim()}\n\nContext sigur din widget:\n${contextLines.join("\n")}`;
}

export function restoreSupportMessages(value: string | null): StoredSupportMessage[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is StoredSupportMessage => {
        if (!item || typeof item !== "object") return false;
        const candidate = item as Partial<StoredSupportMessage>;
        return (
          typeof candidate.id === "string" &&
          (candidate.role === "customer" || candidate.role === "team") &&
          typeof candidate.text === "string" &&
          candidate.text.length <= 2200 &&
          typeof candidate.createdAt === "string"
        );
      })
      .slice(-20);
  } catch {
    return [];
  }
}
