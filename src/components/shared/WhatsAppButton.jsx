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
      variant={variant}
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      WhatsApp
    </Button>
  );
}