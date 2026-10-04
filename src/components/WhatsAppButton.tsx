import { MessageCircle } from "lucide-react";

const PHONE = "5511999999999";
const MESSAGE =
  "Olá! Conheci o VagaTracker e gostaria de receber ajuda para melhorar meu currículo e aumentar minhas chances de conseguir entrevistas.";

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-primary-foreground shadow-card transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-whatsapp/40"
    >
      <MessageCircle className="h-7 w-7" aria-hidden />
    </a>
  );
}
