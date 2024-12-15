interface Window {
  kasware: {
    requestAccounts: () => Promise<string[]>
    getBalance: () => Promise<{
      confirmed: number
      unconfirmed: number
      total: number
    }>
    disconnect: (origin: string) => Promise<void>
  }
} 