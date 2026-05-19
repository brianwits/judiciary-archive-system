export type ContractErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export type FieldErrors = Record<string, string[]>;

export type ContractError = {
  code: ContractErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
  requestId?: string;
};

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: ContractError };

export function actionOk(): ActionResult<undefined>;
export function actionOk<T>(data: T): ActionResult<T>;
export function actionOk<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function actionError(
  code: ContractErrorCode,
  message: string,
  fieldErrors?: FieldErrors,
): ActionResult<never> {
  return {
    ok: false,
    error: {
      code,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
    },
  };
}

export function normalizeFieldErrors(
  errors: Record<string, string[] | undefined>,
): FieldErrors {
  return Object.fromEntries(
    Object.entries(errors).filter((entry): entry is [string, string[]] =>
      Array.isArray(entry[1]),
    ),
  );
}

export function getActionErrorMessage(result: ActionResult<unknown>) {
  return result.ok ? null : result.error.message;
}
