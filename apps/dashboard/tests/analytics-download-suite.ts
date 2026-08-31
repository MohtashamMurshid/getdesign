import { afterAll, expect, mock, test } from "bun:test";
const capture = mock();
mock.module("@getdesign/analytics", () => ({
  getAnalytics: () => ({ capture }),
}));
const { downloadDesignMd } = await import("../lib/download-design-md");
const originalDocument = globalThis.document;
const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;
afterAll(() => {
  globalThis.document = originalDocument;
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
});

test("download captures once after dispatch and never sends content or filename", () => {
  const click = mock(() => {
    expect(capture).not.toHaveBeenCalled();
  });
  const remove = mock();
  globalThis.document = {
    createElement: () => ({ click }),
    body: { appendChild() {}, removeChild: remove },
  } as unknown as Document;
  URL.createObjectURL = () => "blob:private-content";
  URL.revokeObjectURL = mock();
  downloadDesignMd("# SECRET generated content", "private-site-design.md");
  expect(click).toHaveBeenCalledTimes(1);
  expect(capture.mock.calls).toEqual([
    [{ event: "design_md_downloaded", properties: {} }],
  ]);
  expect(remove).toHaveBeenCalledTimes(1);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:private-content");
});

test("failed download dispatch emits nothing and still cleans up", () => {
  capture.mockClear();
  const remove = mock();
  globalThis.document = {
    createElement: () => ({
      click() {
        throw new Error("download blocked");
      },
    }),
    body: { appendChild() {}, removeChild: remove },
  } as unknown as Document;
  expect(() => downloadDesignMd("# SECRET", "private.md")).toThrow(
    "download blocked",
  );
  expect(capture).not.toHaveBeenCalled();
  expect(remove).toHaveBeenCalledTimes(1);
});
