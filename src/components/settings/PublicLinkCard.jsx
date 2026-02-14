import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Copy, Share2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PublicLinkCard({ restaurant }) {
  const [copied, setCopied] = useState(false);

  if (!restaurant) return null;

  // Criar URL absoluto completo - usando nova rota pública
  const publicUrl = `${window.location.origin}/BookingPublic?slug=${restaurant.slug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const message = encodeURIComponent(`🍽️ Reserve sua mesa no ${restaurant.name}!\n\n${publicUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const openInNewTab = () => {
    window.open(publicUrl, '_blank');
  };

  return (
    <Card className="shadow-lg border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[#A56A38]" />
          Link Público de Reservas
        </CardTitle>
        <CardDescription>
          Compartilhe este link com seus clientes para que possam fazer reservas online
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded-lg p-4 border-2 border-amber-300">
          <div className="flex gap-2">
            <Input
              value={publicUrl}
              readOnly
              className="font-mono text-sm bg-gray-50"
            />
            <Button
              onClick={copyToClipboard}
              variant={copied ? "default" : "outline"}
              className={copied ? "bg-green-600 hover:bg-green-700" : "hover:bg-amber-50 hover:text-[#A56A38] hover:border-[#A56A38]"}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {copied && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              ✓ Link copiado com sucesso!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={openInNewTab}
            variant="outline"
            className="w-full hover:bg-amber-50 hover:text-[#A56A38] hover:border-[#A56A38]"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Página
          </Button>

          <Button
            onClick={shareWhatsApp}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>

        <div className="bg-amber-100 border border-amber-300 rounded-lg p-4">
          <h4 className="font-semibold text-sm text-amber-900 mb-2">💡 Como usar:</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Copie e cole o link em suas redes sociais</li>
            <li>• Adicione ao Instagram e WhatsApp Business</li>
            <li>• Cole no Google Meu Negócio</li>
            <li>• Envie diretamente para clientes via WhatsApp</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}