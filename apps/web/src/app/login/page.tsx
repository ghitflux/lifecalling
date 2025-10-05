"use client";
import { useEffect, useState } from "react";
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Badge } from "@lifecalling/ui";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      const urlParams = new URLSearchParams(window.location.search);
      const nextUrl = urlParams.get('next');

      await login(email, password, nextUrl || undefined);
      toast.success("Login realizado com sucesso!");
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
      const urlParams = new URLSearchParams(window.location.search);
      const nextUrl = urlParams.get('next');

      await login(demoEmail, demoPassword, nextUrl || undefined);
      toast.success("Login realizado com sucesso!");
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
        { name: "Um", email: "admin@lifecalling.com", password: "123456" }
      ]
    },
    {
      level: "Supervisor",
      color: "bg-blue-500",
      users: [
        { name: "Dois", email: "supervisor@lifecalling.com", password: "123456" }
      ]
    },
    {
      level: "Financeiro",
      color: "bg-green-500",
      users: [
        { name: "Três", email: "financeiro@lifecalling.com", password: "123456" }
      ]
    },
    {
      level: "Calculista",
      color: "bg-yellow-500",
      users: [
        { name: "Quatro", email: "calculista@lifecalling.com", password: "123456" }
      ]
    },
    {
      level: "Gerente de Fechamento",
      color: "bg-teal-500",
      users: [
        { name: "Cinco", email: "fechamento@lifecalling.com", password: "123456" }
      ]
    },
    {
      level: "Atendente",
      color: "bg-purple-500",
      users: [
        { name: "Seis", email: "atendente1@lifecalling.com", password: "123456" },
        { name: "Sete", email: "atendente2@lifecalling.com", password: "123456" },
        { name: "Oito", email: "atendente3@lifecalling.com", password: "123456" },
        { name: "Nove", email: "atendente4@lifecalling.com", password: "123456" },
        { name: "Dez", email: "atendente5@lifecalling.com", password: "123456" },
        { name: "Onze", email: "atendente6@lifecalling.com", password: "123456" },
        { name: "Doze", email: "atendente7@lifecalling.com", password: "123456" }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Imagem */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        <Image
          src="/assets/atendente.webp"
          alt="Atendente de Call Center"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px]" />
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-background relative">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-2">
            <Image
              src="/assets/lifeservice.png"
              alt="Life Service"
              width={280}
              height={80}
              className="mb-2"
              priority
            />
          </div>

          {/* Card de Login */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-lg">
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold">Bem-vindo</h1>
                <p className="text-sm text-muted-foreground">Entre com suas credenciais</p>
              </div>

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
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full h-11"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              {/* Botão Credenciais Demo */}
              <div className="pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCredentialsModalOpen(true)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Ver Credenciais Demo
                </Button>
              </div>
            </div>
          </div>

          {/* Rodapé */}
          <p className="text-center text-xs text-muted-foreground">
            © 2025 Life Serviços. Todos os direitos reservados.
          </p>
        </div>
      </div>

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
