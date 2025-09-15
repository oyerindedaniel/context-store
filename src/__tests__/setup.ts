import { cleanup } from "@testing-library/react";
import { vi, afterEach } from "vitest";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
