import type {Metadata} from 'next'
import localFont from 'next/font/local'
import {designVariablesCss} from '@/lib/design'
import {PageTransition} from '@/components/PageTransition'
import './globals.css'

const graphik = localFont({
  src: [
    {
      path: '../public/fonts/Graphik-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Graphik-Regular.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Graphik-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Graphik-Medium.woff',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Graphik-Semibold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/Graphik-Semibold.woff',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-graphik',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 're.design',
    template: '%s — re.design',
  },
  description: 'Independent design studio.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${graphik.variable} h-full antialiased`}
    >
      <head>
        {/* Apply the saved theme before paint so there's no flash. Dark is the
            default (no attribute); only light needs setting. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}",
          }}
        />
        {/* Color tokens emitted from lib/design.ts — edit there. */}
        <style dangerouslySetInnerHTML={{__html: designVariablesCss()}} />
      </head>
      <body className="min-h-full flex flex-col bg-canvas text-text-primary font-sans">
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  )
}
