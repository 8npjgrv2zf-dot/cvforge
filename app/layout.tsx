import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CVforge — AI Resume Builder',
  description: 'Создайте профессиональное резюме за 30 секунд с помощью Claude AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
