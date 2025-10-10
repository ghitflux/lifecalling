import { signIn } from '@/lib/auth'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { Heading } from '@/ui/components/Heading'

export default async function SignInPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/')
  }

  async function handleSignIn(formData: FormData) {
    'use server'

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      await signIn('credentials', {
        email,
        password,
        redirectTo: '/',
      })
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Heading level={2}>Licall</Heading>
          <p className="mt-2 text-gray-600">Sistema de Atendimentos</p>
        </div>

        <Card className="mt-8" padding="lg">
          <form action={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Sua senha"
              />
            </div>

            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Usuários de teste:</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• atendente@licall.dev (senha: dev123)</div>
              <div>• calculista@licall.dev (senha: dev123)</div>
              <div>• gerente@licall.dev (senha: dev123)</div>
              <div>• financeiro@licall.dev (senha: dev123)</div>
              <div>• admin@licall.dev (senha: dev123)</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}