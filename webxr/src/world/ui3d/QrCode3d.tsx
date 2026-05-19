import { useEffect, useState } from 'react'
import { useTexture } from '@react-three/drei'
import { qrDataUrl } from '@/ui/qrDataUrl'

interface Props {
  url: string
  size?: number
  renderOrder?: number
}

export function QrCode3d({ url, size = 0.28, renderOrder = 82 }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void qrDataUrl(url).then((src) => {
      if (alive) setDataUrl(src)
    })
    return () => {
      alive = false
    }
  }, [url])

  if (!dataUrl) return null

  return <QrCodeMesh dataUrl={dataUrl} size={size} renderOrder={renderOrder} />
}

function QrCodeMesh({
  dataUrl,
  size,
  renderOrder,
}: {
  dataUrl: string
  size: number
  renderOrder: number
}) {
  const texture = useTexture(dataUrl)
  return (
    <mesh renderOrder={renderOrder} position={[0, -0.02, 0.01]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} transparent depthTest={false} depthWrite={false} />
    </mesh>
  )
}
