import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export default function WhatsAppButton({ phone, message, size = "default", variant = "outline", className = "" }) {
  const handleClick = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : '';
    window.open(`https://wa.me/55${cleanPhone}${encodedMessage}`, '_blank');
  };

  return (
    <Button
      onClick={handleClick}
      size={size}
      variant="default"
      className={`bg-[#25D366] hover:bg-[#20BA5A] text-white border-0 h-9 px-3 text-sm ${className}`}
    >
      <MessageCircle className="w-4 h-4 mr-1.5" />
      WhatsApp
    </Button>
  );
}