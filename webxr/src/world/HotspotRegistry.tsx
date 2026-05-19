import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react'
import type { Object3D } from 'three'

interface Registry {
  register: (id: string, object: Object3D) => void
  unregister: (id: string) => void
  targets: () => Object3D[]
}

const HotspotRegistryContext = createContext<Registry | null>(null)

export function HotspotRegistryProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef(new Map<string, Object3D>())

  const value = useMemo<Registry>(
    () => ({
      register: (id, object) => {
        object.userData.hotspotId = id
        mapRef.current.set(id, object)
      },
      unregister: (id) => {
        mapRef.current.delete(id)
      },
      targets: () => Array.from(mapRef.current.values()),
    }),
    [],
  )

  return (
    <HotspotRegistryContext.Provider value={value}>{children}</HotspotRegistryContext.Provider>
  )
}

export function useHotspotRegistry() {
  const ctx = useContext(HotspotRegistryContext)
  if (!ctx) throw new Error('useHotspotRegistry requires HotspotRegistryProvider')
  return ctx
}

export function useOptionalHotspotRegistry() {
  return useContext(HotspotRegistryContext)
}
