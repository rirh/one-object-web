import { useEffect, useLayoutEffect, useRef } from "react"
import { useLocation } from "react-router"
import NProgress from "nprogress"
import "nprogress/nprogress.css"
import "./route-progress.css"

NProgress.configure({ showSpinner: false })

let pendingRoutes = 0

export function RouteProgress() {
  const location = useLocation()
  const previousPath = useRef(location.pathname)

  useLayoutEffect(() => {
    const isFilesQueryChange =
      previousPath.current === "/dashboard/files" &&
      location.pathname === "/dashboard/files"
    previousPath.current = location.pathname
    if (isFilesQueryChange) {
      NProgress.done()
      return
    }
    NProgress.start()
    const timer = window.setTimeout(() => {
      if (pendingRoutes === 0) NProgress.done()
    }, 150)
    return () => window.clearTimeout(timer)
  }, [location])

  useEffect(
    () => () => {
      NProgress.done()
      NProgress.remove()
    },
    [],
  )

  return null
}

export function RouteProgressPending() {
  useLayoutEffect(() => {
    pendingRoutes += 1
    NProgress.start()
    return () => {
      pendingRoutes -= 1
      if (pendingRoutes === 0) NProgress.done()
    }
  }, [])

  return null
}
