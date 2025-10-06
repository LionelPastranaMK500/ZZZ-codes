import { useEffect } from 'react'

declare global {
  interface Window {
    api?: {
      onMainMessage?: (cb: (msg: unknown) => void) => () => void
    }
  }
}

export default function App() {
  useEffect(() => {
    const off = window.api?.onMainMessage?.((m) => {
      console.log('Mensaje desde MAIN:', m)
    })
    return () => off && off()
  }, [])

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-semibold">ZZZ Codes</h1>
      <p className="text-zinc-300">Plantilla OK. IPC funcionando.</p>
      <p className="text-zinc-300">React + Vite + Electron + TailwindCSS</p>
      <p className="text-zinc-300">by Andriy Svyryd</p>
      <p className="text-zinc-300">2024</p>
    </div>
  )
}
