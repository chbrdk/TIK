import QRCode from 'qrcode'
import { visualTokens } from '@/config/visual-tokens'

/** Data-URL QR image for 3D panels (yellow on dark, MSQDX booth style). */
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 280,
    margin: 1,
    color: {
      dark: visualTokens.brandYellow,
      light: visualTokens.surfaceDark,
    },
  })
}
