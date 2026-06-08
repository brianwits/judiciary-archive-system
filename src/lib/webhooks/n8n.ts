type FileMovementWebhookPayload = {
  type: "checkout" | "checkin";
  caseNumber: string;
  destination: string;
  user: string;
};

// Timeout is generous for internal webhook — slow n8n should not block
// the checkout flow beyond this ceiling.
const WEBHOOK_TIMEOUT_MS = 5_000;
const WEBHOOK_RETRIES = 2;

/**
 * Sends a file-movement notification to the configured n8n webhook URL.
 *
 * - Non-blocking: webhook failures must never break checkout flow.
 * - Includes a 5-second timeout so a slow n8n response doesn't consume
 *   a serverless function's wall-clock budget.
 * - Logs outcome at `console.info` for observability (structured JSON).
 * - Set `N8N_FILE_MOVEMENT_WEBHOOK_URL` to enable outbound notifications.
 *
 * The function is intentionally fire-and-forget from the caller's
 * perspective — callers should `await` it only if they want the webhook
 * to complete before responding to the client.
 */
export async function notifyFileMovement(payload: FileMovementWebhookPayload): Promise<void> {
  const url = process.env.N8N_FILE_MOVEMENT_WEBHOOK_URL;
  if (!url) {
    console.info(
      JSON.stringify({
        event: "webhook_skipped",
        reason: "N8N_FILE_MOVEMENT_WEBHOOK_URL not configured",
        payload,
      }),
    );
    return;
  }

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= WEBHOOK_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          source: "judiciary-archive",
          attempt,
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`n8n webhook responded with ${response.status}`);
      }

      console.info(
        JSON.stringify({
          event: "webhook_success",
          attempt,
          caseNumber: payload.caseNumber,
          statusCode: response.status,
        }),
      );

      return; // success — exit early
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < WEBHOOK_RETRIES) {
        console.warn(
          JSON.stringify({
            event: "webhook_retry",
            attempt,
            error: lastError.message,
            caseNumber: payload.caseNumber,
          }),
        );
      }
    }
  }

  // All retries exhausted — log but don't throw (non-blocking contract)
  console.error(
    JSON.stringify({
      event: "webhook_failed",
      error: lastError?.message ?? "Unknown error",
      caseNumber: payload.caseNumber,
      retries: WEBHOOK_RETRIES,
    }),
  );
}
