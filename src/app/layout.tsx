import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | FOXAI Portal',
    default: 'FOXAI Portal',
  },
  description: 'FOXAI Internal Product Showcase Portal — AI & ERP Solutions',
}

// Root layout: pass-through only.
// html/body are owned by [locale]/layout.tsx (next-intl pattern).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
