// app/layout.tsx
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'

export const metadata = { title: 'Starter', description: 'Next + Firebase + Cloudinary' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="en">
<body>
<AuthProvider>{children}</AuthProvider>
</body>
</html>
)
}