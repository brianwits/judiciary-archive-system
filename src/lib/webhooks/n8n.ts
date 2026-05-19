type FileMovementWebhookPayload = {
  type: "checkout" | "checkin";
  caseNumber: string;
  destination: string;
  user: string;
};

/**
 * Stub for n8n file movement webhook integration.
 * Set N8N_FILE_MOVEMENT_WEBHOOK_URL to enable outbound notifications.
 */
export async function notifyFileMovement(payload: FileMovementWebhookPayload): Promise<void> {
  const url = process.env.N8N_FILE_MOVEMENT_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
        source: "judiciary-archive",
      }),
    });
  } catch {
    // Non-blocking: webhook failures must not break checkout flow
  }
}
