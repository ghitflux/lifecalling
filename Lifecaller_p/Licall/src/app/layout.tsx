import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getCurrentUser } from '@/lib/auth'
import { ROLE_LABELS } from '@/lib/rbac'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Licall - Sistema de Atendimentos',
  description: 'Sistema de gestão de atendimentos e simulações',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {user && (
            <nav className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <h1 className="text-xl font-bold text-gray-900">Licall</h1>
                    </div>
                    <div className="ml-6 flex space-x-4">
                      <a
                        href="/"
                        className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                      >
                        Esteira Global
                      </a>
                      {user.role === 'calculista' && (
                        <a
                          href="/calc"
                          className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                        >
                          Cálculo
                        </a>
                      )}
                      {user.role === 'gerente_fechamento' && (
                        <a
                          href="/closing"
                          className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                        >
                          Fechamento
                        </a>
                      )}
                      {user.role === 'financeiro' && (
                        <a
                          href="/finance"
                          className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                        >
                          Financeiro
                        </a>
                      )}
                      {user.role === 'superadmin' && (
                        <>
                          <a
                            href="/calc"
                            className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                          >
                            Cálculo
                          </a>
                          <a
                            href="/closing"
                            className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                          >
                            Fechamento
                          </a>
                          <a
                            href="/finance"
                            className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                          >
                            Financeiro
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">{user.name}</span>
                      <span className="ml-2 text-gray-500">
                        ({ROLE_LABELS[user.role]})
                      </span>
                    </div>
                    <form action="/api/auth/signout" method="post" className="ml-4">
                      <button
                        type="submit"
                        className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                      >
                        Sair
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </nav>
          )}
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}