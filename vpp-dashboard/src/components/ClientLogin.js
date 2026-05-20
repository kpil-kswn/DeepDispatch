'use client'

import dynamic from 'next/dynamic'

// used middleman
const LoginModel = dynamic(() => import('./LoginModel'), { ssr: false })

export default function ClientLogin() {
  return <LoginModel />
}