import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MiraClass - Educational Social Network Platform',
  description: '교육용 소셜 네트워크 플랫폼으로 학생과 교사가 함께 학습하고 소통할 수 있는 환경을 제공합니다.',
  keywords: ['education', 'social-network', 'students', 'teachers', 'learning'],
  authors: [{ name: 'MiraClass Team' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div id="__next">
          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  )
}