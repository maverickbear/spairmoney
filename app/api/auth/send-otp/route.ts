import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

/**
 * POST /api/auth/send-otp
 * Sends OTP email to user for email verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    console.log("[SEND-OTP] Request received for email:", email);

    if (!email) {
      console.error("[SEND-OTP] Email is missing");
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    console.log("[SEND-OTP] Attempting to resend OTP for signup type");

    // Resend OTP for signup
    const { error, data } = await supabase.auth.resend({
      type: "signup",
      email: email,
    });

    if (error) {
      console.error("[SEND-OTP] Error resending OTP:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      
      // Provide more helpful error messages
      let errorMessage = "Falha ao enviar código de verificação";
      if (error.message?.includes("rate limit") || error.message?.includes("too many")) {
        errorMessage = "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
      } else if (error.message?.includes("not found") || error.message?.includes("user")) {
        errorMessage = "Usuário não encontrado. Verifique se o email está correto.";
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    console.log("[SEND-OTP] OTP sent successfully to:", email);
    return NextResponse.json({ 
      success: true,
      message: "Código de verificação enviado com sucesso" 
    });
  } catch (error) {
    console.error("[SEND-OTP] Unexpected error:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro inesperado" },
      { status: 500 }
    );
  }
}

