/**
 * Script para testar o envio do email de boas-vindas
 * 
 * Uso:
 *   npx tsx scripts/test-welcome-email.ts seu-email@exemplo.com
 * 
 * Ou configure o email diretamente no código abaixo
 */

import { sendWelcomeEmail } from "@/lib/utils/email";

async function testWelcomeEmail() {
  // Pegar email do argumento da linha de comando ou usar o padrão
  const email = process.argv[2] || "naortartarotti@gmail.com";

  if (!email) {
    console.error("❌ Por favor, forneça um email como argumento:");
    console.error("   npx tsx scripts/test-welcome-email.ts seu-email@exemplo.com");
    process.exit(1);
  }

  console.log("📧 Testando envio de email de boas-vindas...");
  console.log("📬 Destinatário:", email);
  console.log("");

  try {
    await sendWelcomeEmail({
      to: email,
      userName: "", // Não usado mais
      founderName: "Naor Tartarotti",
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://spair.co",
    });

    console.log("");
    console.log("✅ Email enviado com sucesso!");
    console.log("📬 Verifique a caixa de entrada de:", email);
    console.log("");
    console.log("💡 Nota: Se estiver em modo de teste do Resend, o email só será enviado");
    console.log("   para endereços verificados no painel do Resend.");
  } catch (error) {
    console.error("");
    console.error("❌ Erro ao enviar email:", error);
    if (error instanceof Error) {
      console.error("   Mensagem:", error.message);
    }
    process.exit(1);
  }
}

// Executar o teste
testWelcomeEmail();

