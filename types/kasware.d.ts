interface KaswareBalance {
  confirmed: number
  unconfirmed: number
  total: number
}

interface Kasware {
  requestAccounts: () => Promise<string[]>
  getBalance: () => Promise<KaswareBalance>
  disconnect: (origin: string) => Promise<void>
}

declare global {
  interface Window {
    kasware: Kasware
  }
}
