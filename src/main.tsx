import React from "react"
import ReactDOM from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router"
import { Provider } from "jotai"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { App } from "./App"
import "./styles.css"
const client = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, retry: 1 } },
})
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider>
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <Toaster richColors />
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
)
