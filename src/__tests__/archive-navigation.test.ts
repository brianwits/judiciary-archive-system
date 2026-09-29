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

  it("renders back to dashboard link when from=dashboard is in searchParams", async () => {
    const { default: CaseDetailPage } = await import("@/app/(app)/cases/[id]/page");
    const page = await CaseDetailPage({
      params: Promise.resolve({ id: "case-001" }),
      searchParams: Promise.resolve({ from: "dashboard" }),
    });

    const link = page.props.children[0];
    expect(link.props.href).toBe("/");
    expect(link.props.children).toBe("← Back to dashboard");
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

describe("RoomDetailPage back navigation", () => {
  it("renders back to dashboard link when from=dashboard is in searchParams", async () => {
    const { default: RoomDetailPage } = await import("@/app/(app)/archive/rooms/[roomId]/page");
    const page = await RoomDetailPage({
      params: Promise.resolve({ roomId: "room-r1" }),
      searchParams: Promise.resolve({ from: "dashboard" }),
    });

    const link = page.props.children[0];
    expect(link.props.href).toBe("/");
    expect(link.props.children).toBe("← Back to dashboard");
  }, 15000);

  it("renders back to archive link when from=archive is in searchParams", async () => {
    const { default: RoomDetailPage } = await import("@/app/(app)/archive/rooms/[roomId]/page");
    const page = await RoomDetailPage({
      params: Promise.resolve({ roomId: "room-r1" }),
      searchParams: Promise.resolve({ from: "archive" }),
    });

    const link = page.props.children[0];
    expect(link.props.href).toBe("/archive");
    expect(link.props.children).toBe("← Back to archive");
  }, 15000);

  it("renders back to archive link when searchParams is undefined", async () => {
    const { default: RoomDetailPage } = await import("@/app/(app)/archive/rooms/[roomId]/page");
    const page = await RoomDetailPage({
      params: Promise.resolve({ roomId: "room-r1" }),
    });

    const link = page.props.children[0];
    expect(link.props.href).toBe("/archive");
    expect(link.props.children).toBe("← Back to archive");
  }, 15000);
});

describe("getEffectiveActivePath navigation highlighter", () => {
  it("keeps Archive Storage active when viewing a case with from=archive", async () => {
    const { getEffectiveActivePath } = await import("@/config/navigation");
    expect(getEffectiveActivePath("/cases/case-001", "archive")).toBe("/archive");
  });

  it("keeps Dashboard active when viewing a case with from=dashboard", async () => {
    const { getEffectiveActivePath } = await import("@/config/navigation");
    expect(getEffectiveActivePath("/cases/case-001", "dashboard")).toBe("/");
  });

  it("keeps Dashboard active when viewing an archive room with from=dashboard", async () => {
    const { getEffectiveActivePath } = await import("@/config/navigation");
    expect(getEffectiveActivePath("/archive/rooms/loc-room-a", "dashboard")).toBe("/");
  });

  it("keeps Archive Storage active when viewing an archive room with from=archive", async () => {
    const { getEffectiveActivePath } = await import("@/config/navigation");
    expect(getEffectiveActivePath("/archive/rooms/loc-room-a", "archive")).toBe("/archive");
  });

  it("defaults to original pathname when viewing a case without from parameter", async () => {
    const { getEffectiveActivePath } = await import("@/config/navigation");
    expect(getEffectiveActivePath("/cases/case-001", null)).toBe("/cases/case-001");
  });

  it("defaults to original pathname for general routes", async () => {
    const { getEffectiveActivePath } = await import("@/config/navigation");
    expect(getEffectiveActivePath("/", null)).toBe("/");
    expect(getEffectiveActivePath("/cases", null)).toBe("/cases");
    expect(getEffectiveActivePath("/archive", null)).toBe("/archive");
    expect(getEffectiveActivePath("/tracking", null)).toBe("/tracking");
  });
});
