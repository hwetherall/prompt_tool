import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Prompt Builder',
  description: 'Create and compose AI prompt snippets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white shadow-sm border-b">
          <div className="container">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <Link href="/" className="text-xl font-bold text-primary">
                  Prompt Builder
                </Link>
                <div className="flex items-center space-x-6">
                  <Link
                    href="/snippets"
                    className="text-gray-700 hover:text-primary transition-colors"
                  >
                    Snippets
                  </Link>
                  <Link
                    href="/prompts"
                    className="text-gray-700 hover:text-primary transition-colors"
                  >
                    Prompts
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/snippets/new"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors"
                >
                  New Snippet
                </Link>
                <Link
                  href="/prompts/new"
                  className="px-4 py-2 border border-gray-300 rounded-md hover:border-gray-400 transition-colors"
                >
                  New Prompt
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="bg-gray-100 border-t mt-auto">
          <div className="container py-8">
            <p className="text-center text-gray-600 text-sm">
              © {new Date().getFullYear()} Prompt Builder. Built for collaborative prompt engineering.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
