"use client";
import { useEffect, useState } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge } from "@lifecalling/ui";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/esteira");
    }
  }, [user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Obtem o parâmetro 'next' da URL se disponível
      const urlParams = new URLSearchParams(window.location.search);
      const nextUrl = urlParams.get('next');

      await login(email, password, nextUrl || undefined);
      toast.success("Login realizado com sucesso!");
      // O redirecionamento é feito automaticamente pelo hook useAuth
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || "Erro no login. Verifique suas credenciais.";
      toast.error(errorMessage);
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fill = async (demoEmail: string, demoPassword: string) => {
    setCredentialsModalOpen(false);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    try {
      // Obtem o parâmetro 'next' da URL se disponível
      const urlParams = new URLSearchParams(window.location.search);
      const nextUrl = urlParams.get('next');

      await login(demoEmail, demoPassword, nextUrl || undefined);
      toast.success("Login realizado com sucesso!");
      // O redirecionamento é feito automaticamente pelo hook useAuth
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || "Erro no login. Verifique suas credenciais.";
      toast.error(errorMessage);
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    {
      level: "Administrador",
      color: "bg-red-500",
      users: [
        { name: "Admin Principal", email: "admin@lifecalling.com", password: "admin123" },
        { name: "Admin Secundário", email: "admin2@lifecalling.com", password: "admin123" },
        { name: "Admin Backup", email: "admin3@lifecalling.com", password: "admin123" }
      ]
    },
    {
      level: "Supervisor",
      color: "bg-blue-500",
      users: [
        { name: "Supervisor João", email: "supervisor@lifecalling.com", password: "super123" },
        { name: "Supervisor Maria", email: "supervisor2@lifecalling.com", password: "super123" },
        { name: "Supervisor Pedro", email: "supervisor3@lifecalling.com", password: "super123" }
      ]
    },
    {
      level: "Calculista",
      color: "bg-yellow-500",
      users: [
        { name: "Calculista Lucas", email: "calculista@lifecalling.com", password: "calc123" },
        { name: "Calculista Julia", email: "calculista2@lifecalling.com", password: "calc123" },
        { name: "Calculista Bruno", email: "calculista3@lifecalling.com", password: "calc123" }
      ]
    },
    {
      level: "Financeiro",
      color: "bg-green-500",
      users: [
        { name: "Financeiro Carlos", email: "financeiro@lifecalling.com", password: "fin123" },
        { name: "Financeiro Ana", email: "financeiro2@lifecalling.com", password: "fin123" },
        { name: "Financeiro Rita", email: "financeiro3@lifecalling.com", password: "fin123" }
      ]
    },
    {
      level: "Atendente",
      color: "bg-purple-500",
      users: [
        { name: "Atendente Paula", email: "atendente@lifecalling.com", password: "atend123" },
        { name: "Atendente Marcos", email: "atendente2@lifecalling.com", password: "atend123" },
        { name: "Atendente Sandra", email: "atendente3@lifecalling.com", password: "atend123" }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Lifecalling
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Entre com suas credenciais para acessar o sistema
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          
          {/* Botão para abrir modal de credenciais */}
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCredentialsModalOpen(true)}
              className="text-xs"
            >
              <Users className="w-4 h-4 mr-2" />
              Ver Credenciais Demo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Credenciais */}
      <Dialog open={credentialsModalOpen} onOpenChange={setCredentialsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Credenciais de Usuários Demo
            </DialogTitle>
            <DialogDescription>
              Clique em qualquer usuário para fazer login automaticamente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Mostrar senhas:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswords(!showPasswords)}
                className="h-8 w-8 p-0"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            
            {demoUsers.map((levelGroup, levelIndex) => (
              <div key={levelIndex} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={`${levelGroup.color} text-white`}>
                    {levelGroup.level}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({levelGroup.users.length} usuários)
                  </span>
                </div>
                
                <div className="grid gap-2">
                  {levelGroup.users.map((user, userIndex) => (
                    <div
                      key={userIndex}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => fill(user.email, user.password)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Senha: {showPasswords ? user.password : "••••••"}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Usar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
