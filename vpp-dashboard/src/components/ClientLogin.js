'use client'

import dynamic from 'next/dynamic'

// This middleman safely hides the LoginModel from Vercel's build engine
const LoginModel = dynamic(() => import('./LoginModel'), { ssr: false })

export default function ClientLogin() {
  return <LoginModel />
}