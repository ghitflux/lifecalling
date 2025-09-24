import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { StatusBadge } from '../components/StatusBadge'
import { Heading } from '../components/Heading'

const ThemePlayground = () => {
  return (
    <div className="p-6 space-y-8">
      {/* Colors */}
      <section>
        <Heading level={2} className="mb-4">Colors</Heading>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Primary</h4>
            <div className="flex gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(shade => (
                <div key={shade} className="text-center">
                  <div
                    className={`w-12 h-12 rounded bg-primary-${shade} border`}
                  />
                  <div className="text-xs mt-1">{shade}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Gray</h4>
            <div className="flex gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(shade => (
                <div key={shade} className="text-center">
                  <div
                    className={`w-12 h-12 rounded bg-gray-${shade} border`}
                  />
                  <div className="text-xs mt-1">{shade}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Semantic Colors</h4>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded bg-success-500 border" />
                <div className="text-xs mt-1">Success</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded bg-warning-500 border" />
                <div className="text-xs mt-1">Warning</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded bg-error-500 border" />
                <div className="text-xs mt-1">Error</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section>
        <Heading level={2} className="mb-4">Typography</Heading>
        <div className="space-y-2">
          <Heading level={1}>Heading 1 - 4xl</Heading>
          <Heading level={2}>Heading 2 - 3xl</Heading>
          <Heading level={3}>Heading 3 - 2xl</Heading>
          <Heading level={4}>Heading 4 - xl</Heading>
          <Heading level={5}>Heading 5 - lg</Heading>
          <Heading level={6}>Heading 6 - base</Heading>
          <p className="text-base">Body text - base</p>
          <p className="text-sm">Small text - sm</p>
          <p className="text-xs">Extra small text - xs</p>
        </div>
      </section>

      {/* Buttons */}
      <section>
        <Heading level={2} className="mb-4">Buttons</Heading>
        <div className="space-y-4">
          <div className="space-x-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="error">Error</Button>
            <Button variant="ghost">Ghost</Button>
          </div>

          <div className="space-x-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>

          <div className="space-x-4">
            <Button disabled>Disabled</Button>
            <Button loading>Loading</Button>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section>
        <Heading level={2} className="mb-4">Cards</Heading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <h3 className="font-medium mb-2">Default Card</h3>
            <p className="text-sm text-gray-600">This is a default card with medium padding and shadow.</p>
          </Card>

          <Card padding="lg" shadow="lg">
            <h3 className="font-medium mb-2">Large Card</h3>
            <p className="text-sm text-gray-600">This card has large padding and shadow.</p>
          </Card>

          <Card border={false} shadow="none" className="bg-gray-50">
            <h3 className="font-medium mb-2">Custom Card</h3>
            <p className="text-sm text-gray-600">This card has no border, no shadow, and custom background.</p>
          </Card>
        </div>
      </section>

      {/* Status Badges */}
      <section>
        <Heading level={2} className="mb-4">Status Badges</Heading>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="DISPONIVEL" />
          <StatusBadge status="ATRIBUIDO" />
          <StatusBadge status="PENDENTE_CALCULO" />
          <StatusBadge status="SIMULACAO_APROVADA" />
          <StatusBadge status="SIMULACAO_REPROVADA" />
          <StatusBadge status="EM_FECHAMENTO" />
          <StatusBadge status="CONTRATO_CONFIRMADO" />
          <StatusBadge status="ENVIADO_FINANCEIRO" />
          <StatusBadge status="CONTRATO_ATIVADO" />
          <StatusBadge status="ENCERRADO_REPROVADO" />
          <StatusBadge status="ENCERRADO_NAO_APROVADO" />
          <StatusBadge status="ENCERRADO_ATIVADO" />
        </div>
      </section>

      {/* Spacing */}
      <section>
        <Heading level={2} className="mb-4">Spacing</Heading>
        <div className="space-y-4">
          {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map(size => (
            <div key={size} className="flex items-center gap-4">
              <div className="w-16 text-sm">{size}</div>
              <div className={`bg-primary-200 h-4 p-${size}`} />
            </div>
          ))}
        </div>
      </section>

      {/* Border Radius */}
      <section>
        <Heading level={2} className="mb-4">Border Radius</Heading>
        <div className="flex gap-4">
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => (
            <div key={size} className="text-center">
              <div className={`w-16 h-16 bg-primary-200 rounded-${size} border`} />
              <div className="text-xs mt-2">{size}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const meta: Meta<typeof ThemePlayground> = {
  title: 'Design System/Theme Playground',
  component: ThemePlayground,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof ThemePlayground>

export const Default: Story = {}