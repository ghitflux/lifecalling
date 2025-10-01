"use client";
import React, { useState } from "react";
import { Bell, X, Check, CheckCheck, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications, useUnreadNotificationsCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  // Animar badge quando há novas notificações
  React.useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const formatMessage = (notification: any) => {
    switch (notification.event) {
      case "simulation.approved":
        return `Simulação aprovada para atendimento #${notification.payload.case_id}`;
      case "simulation.rejected":
        return `Simulação rejeitada para atendimento #${notification.payload.case_id}`;
      case "case.assigned":
        return `Novo atendimento atribuído: #${notification.payload.case_id}`;
      case "case.status_changed":
        return `Status do atendimento #${notification.payload.case_id} alterado`;
      default:
        return notification.payload.message || "Nova notificação";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Agora";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const handleMarkAsRead = (notificationId: number) => {
    markAsRead.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "relative h-8 w-8 transition-all duration-200",
          isAnimating && "animate-pulse"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className={cn(
          "h-4 w-4 transition-all duration-200",
          unreadCount > 0 && "text-primary"
        )} />
        {unreadCount > 0 && (
          <Badge
            className={cn(
              "absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center",
              "bg-danger text-white border-2 border-background",
              "transition-all duration-200",
              isAnimating && "scale-125"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-10 z-50 w-80 bg-card border border-border rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Notificações</h3>
                {unreadCount > 0 && (
                  <Badge variant="default" className="ml-1 h-5 px-2 text-xs bg-primary">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs h-7 hover:bg-primary/10 hover:text-primary"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Marcar todas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 p-0 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification: any) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 border-b last:border-b-0 transition-all duration-200",
                        "hover:bg-muted/50 cursor-pointer group",
                        !notification.is_read && "bg-primary/5 border-l-4 border-l-primary"
                      )}
                      onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                          !notification.is_read ? "bg-primary/10" : "bg-muted"
                        )}>
                          {notification.event.includes("approved") && (
                            <CheckCircle className={cn(
                              "h-4 w-4",
                              !notification.is_read ? "text-primary" : "text-muted-foreground"
                            )} />
                          )}
                          {notification.event.includes("rejected") && (
                            <XCircle className="h-4 w-4 text-danger" />
                          )}
                          {notification.event.includes("assigned") && (
                            <Bell className={cn(
                              "h-4 w-4",
                              !notification.is_read ? "text-primary" : "text-muted-foreground"
                            )} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm",
                            !notification.is_read ? "font-medium" : "text-muted-foreground"
                          )}>
                            {formatMessage(notification)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-muted/30">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: Navigate to notifications page
                  }}
                >
                  Ver todas as notificações
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}