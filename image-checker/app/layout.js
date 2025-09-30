import './globals.css'

export const metadata = {
  title: 'Image Checker',
  description: 'View and organize images from CSV files',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
