import "./globals.css";
import Providers from "./providers";
import Shell from "@/components/shell/Shell";
import { AuthProvider } from "@/lib/auth";

export const metadata = { title: "Life Digital" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans bg-background text-foreground">
        <Providers>
          <AuthProvider>
            <Shell>{children}</Shell>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
