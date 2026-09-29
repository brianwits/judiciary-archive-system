import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("CaseDetailPage back navigation", () => {
  beforeEach(async () => {
    const { cookies } = await import("next/headers");
    (cookies as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
      delete: vi.fn(),
    });
  });

  it("renders back to archive link when from=archive is in searchParams", async () => {
    const { default: CaseDetailPage } = await import("@/app/(app)/cases/[id]/page");
    const page = await CaseDetailPage({
      params: Promise.resolve({ id: "case-001" }),
      searchParams: Promise.resolve({ from: "archive" }),
    });

    const link = page.props.children[0];
    expect(link.props.href).toBe("/archive");
    expect(link.props.children).toBe("← Back to archive");
  }, 15000);

  it("renders back to cases link when from is not archive", async () => {
    const { default: CaseDetailPage } = await import("@/app/(app)/cases/[id]/page");
    const page = await CaseDetailPage({
      params: Promise.resolve({ id: "case-001" }),
      searchParams: Promise.resolve({ from: undefined }),
    });

    const link = page.props.children[0];
    expect(link.props.href).toBe("/cases");
    expect(link.props.children).toBe("← Back to cases");
  }, 15000);

  it("renders back to cases link when searchParams is undefined", async () => {
    const { default: CaseDetailPage } = await import("@/app/(app)/cases/[id]/page");
    const page = await CaseDetailPage({
      params: Promise.resolve({ id: "case-001" }),
    });

    const link = page.props.children[0];
    expect(link.props.href).toBe("/cases");
    expect(link.props.children).toBe("← Back to cases");
  }, 15000);
});
