import "./globals.css";
import Providers from "./providers";
import Shell from "@/components/shell/Shell";

export const metadata = { title: "Lifecalling" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
