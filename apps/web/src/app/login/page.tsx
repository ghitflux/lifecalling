"use client";
import { useEffect, useState } from "react";
import { Button, Input } from "@lifecalling/ui";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
                <p className="text-muted-foreground">Entre com suas credenciais para acessar o sistema</p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@lifecalling.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
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
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </div>
          </div>

          {/* Rodapé */}
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 Lifecalling. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
