// app/layout.tsx
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'

export const metadata = { title: 'LADUNIMART', description: 'LADUNIMART' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="en">
<body>
<AuthProvider>{children}</AuthProvider>
</body>
</html>
)
}