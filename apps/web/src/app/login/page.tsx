"use client";
import { useEffect, useState } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge } from "@lifecalling/ui";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@demo.local");
  const [password, setPassword] = useState("123456");
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
      await login(email, password);
      toast.success("Login realizado com sucesso!");
      // O redirecionamento é feito automaticamente pelo hook useAuth
    } catch (error) {
      toast.error("Erro no login. Verifique suas credenciais.");
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
      await login(demoEmail, demoPassword);
      toast.success("Login realizado com sucesso!");
      // O redirecionamento é feito automaticamente pelo hook useAuth
    } catch (error) {
      toast.error("Erro no login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    {
      level: "Administrador",
      color: "bg-red-500",
      users: [
        { name: "Carlos Admin", email: "admin@demo.local", password: "123456" }
      ]
    },
    {
      level: "Supervisor",
      color: "bg-blue-500",
      users: [
        { name: "Sara Supervisor", email: "supervisor@demo.local", password: "123456" }
      ]
    },
    {
      level: "Financeiro",
      color: "bg-green-500",
      users: [
        { name: "Fábio Financeiro", email: "financeiro@demo.local", password: "123456" }
      ]
    },
    {
      level: "Calculista",
      color: "bg-yellow-500",
      users: [
        { name: "Cida Calculista", email: "calculista@demo.local", password: "123456" }
      ]
    },
    {
      level: "Atendente",
      color: "bg-purple-500",
      users: [
        { name: "Ana Atendente", email: "atendente@demo.local", password: "123456" }
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
