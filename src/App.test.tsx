import { renderToString } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { expect, it, vi } from "vitest"
import { App } from "./App"

const { query } = vi.hoisted(() => ({
  query: vi.fn(() => {
    throw new Error("public docs must not query authentication")
  }),
}))
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQuery: query,
}))
vi.mock("@/components/async-state", () => ({
  Loading: () => null,
  Failure: () => null,
}))

it("routes anonymous API documentation before authentication checks", () => {
  renderToString(
    <MemoryRouter initialEntries={["/guide"]}>
      <App />
    </MemoryRouter>,
  )
  expect(query).not.toHaveBeenCalled()
})
