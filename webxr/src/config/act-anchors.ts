/** Primary interaction anchor per narrative act (golden Klaus session). */
export function primaryAnchorForAct(act: number): string | null {
  switch (act) {
    case 2:
      return 'diagram_center'
    case 3:
      return 'monitor_left'
    case 4:
      return 'sofa_main'
    case 5:
      return 'qr_panel'
    default:
      return null
  }
}

export function actInteractionHint(act: number, desktop = false): string {
  if (desktop) {
    switch (act) {
      case 1:
        return 'Akt 1 — NOVA läuft, N oder „Weiter“ für Akt 2'
      case 2:
        return 'Signal-Feld: Diagramm läuft · N = weiter'
      case 3:
        return 'Act 3: nach ~13 s CHECKION-Chart · Klick/M = Monitor · blaue Kugel'
      case 4:
        return 'Klick: Sofa → AUDION-Metriken'
      case 5:
        return 'Klick: QR-Panel → Report'
      default:
        return ''
    }
  }
  switch (act) {
    case 1:
      return 'NOVA-Einstieg — automatisch weiter zu Akt 2'
    case 2:
      return 'Signalfeld — tausende Punkte werden zu drei Meldungen'
    case 3:
      return 'Monitor / blaue Kugel = CHECKION-Dashboard'
    case 4:
      return 'Sofa = AUDION-Metriken (Abend)'
    case 5:
      return 'QR-Panel = Take-home Report'
    default:
      return ''
  }
}
