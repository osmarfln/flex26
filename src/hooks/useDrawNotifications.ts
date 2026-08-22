import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getNextDraw } from "@/lib/draw-order";
import { BellRing } from "lucide-react";
import React from "react";

export function useDrawNotifications(location: 'rio' | 'capital') {
  const lastNotifiedRef = useRef<string | null>(null);

  useEffect(() => {
    const checkNotification = () => {
      const nextDraw = getNextDraw(location);
      if (!nextDraw || !nextDraw.timeValue) return;

      const now = new Date();
      const brasiliaTimeStr = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(now);

      const nowParts = brasiliaTimeStr.split(":").map(Number);
      const drawParts = nextDraw.timeValue.split(":").map(Number);
      
      const nowH = nowParts[0] ?? 0;
      const nowM = nowParts[1] ?? 0;
      const drawH = drawParts[0] ?? 0;
      const drawM = drawParts[1] ?? 0;

      const nowMinutes = nowH * 60 + nowM;
      const drawMinutes = drawH * 60 + drawM;
      let diff = drawMinutes - nowMinutes;

      // Se diff for negativo, é porque o sorteio é amanhã (ex: agora 23:00, sorteio 09:00)
      if (diff < 0) return;

      // Notify if within 5 minutes of the draw
      const notificationKey = `${nextDraw.timeType}-${nextDraw.timeValue}-${nextDraw.date.toDateString()}`;
      
      if (diff > 0 && diff <= 5 && lastNotifiedRef.current !== notificationKey) {
        lastNotifiedRef.current = notificationKey;
        
        toast.info(`Próximo Resultado: ${nextDraw.label}`, {
          description: `O sorteio das ${nextDraw.timeValue} (${location === 'rio' ? 'Rio' : 'Capital'}) está chegando em ${diff} minutos!`,
          duration: 10000,
          icon: React.createElement(BellRing, { className: "w-5 h-5 text-primary" }),
        });

        // Request browser notification permission if not granted
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission();
        }

        // Send browser notification if permitted
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`Flex Gerenciador: ${nextDraw.label}`, {
            body: `O resultado das ${nextDraw.timeValue} (${location === 'rio' ? 'Rio' : 'Capital'}) sai em ${diff} minutos!`,
            icon: "/favicon.ico"
          });
        }
      }
    };

    checkNotification();
    const interval = setInterval(checkNotification, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [location]);
}
