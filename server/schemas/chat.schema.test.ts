import { describe, expect, it } from "vitest";
import { chatRequestSchema } from "./chat.schema";


describe("chatRequestSchema", () => {
  it("accepts a message and optional UUID conversation id", () => {
    const result = chatRequestSchema.safeParse({ message: "Remind me tomorrow", conversationId: "d2719c2e-7f48-4db9-9e18-9e1c7e7c9c18" });
    expect(result.success).toBe(true);
  });

  it("rejects blank and oversized messages", () => {
    expect(chatRequestSchema.safeParse({ message: " " }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ message: "x".repeat(4001) }).success).toBe(false);
  });
});
