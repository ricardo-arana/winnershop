/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
  type PrecacheEntry,
} from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>
}

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST)

const fileExtensionRegexp = /[^/?]+\.[^/]+$/
const normalizedBase = (import.meta.env.BASE_URL ?? '/').replace(/\/*$/, '')
const appShellPath = `${normalizedBase || ''}/index.html`
const ensureLeadingSlash = (path: string) => (path.startsWith('/') ? path : `/${path}`)
const appShellUrl = ensureLeadingSlash(appShellPath)

registerRoute(
  ({ request, url }) => request.mode === 'navigate' && !fileExtensionRegexp.test(url.pathname),
  createHandlerBoundToURL(appShellUrl),
)

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
