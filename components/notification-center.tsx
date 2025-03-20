"use client"

import type React from "react"

import { useState } from "react"
import { Bell, CheckCircle, AlertTriangle, Info, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotifications, type Notification } from "@/hooks/use-notifications"

interface NotificationCenterProps {
  notifications: Notification[]
}

export function NotificationCenter({ notifications }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const { markAsRead, markAllAsRead, removeNotification, clearAllNotifications } = useNotifications()

  const unreadCount = notifications.filter((notification) => !notification.read).length

  const handleMarkAsRead = (id: string) => {
    markAsRead(id)
  }

  const handleRemoveNotification = (id: string) => {
    removeNotification(id)
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) {
      return "Agora"
    } else if (diffMins < 60) {
      return `${diffMins} min atrás`
    } else if (diffHours < 24) {
      return `${diffHours} h atrás`
    } else {
      return `${diffDays} d atrás`
    }
  }

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-medium">Notificações</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => markAllAsRead()}
              title="Marcar todas como lidas"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-600"
              onClick={() => clearAllNotifications()}
              title="Limpar todas as notificações"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unread">Não lidas</TabsTrigger>
            <TabsTrigger value="read">Lidas</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <NotificationList
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onRemove={handleRemoveNotification}
              formatTimestamp={formatTimestamp}
              renderIcon={renderNotificationIcon}
            />
          </TabsContent>

          <TabsContent value="unread">
            <NotificationList
              notifications={notifications.filter((n) => !n.read)}
              onMarkAsRead={handleMarkAsRead}
              onRemove={handleRemoveNotification}
              formatTimestamp={formatTimestamp}
              renderIcon={renderNotificationIcon}
            />
          </TabsContent>

          <TabsContent value="read">
            <NotificationList
              notifications={notifications.filter((n) => n.read)}
              onMarkAsRead={handleMarkAsRead}
              onRemove={handleRemoveNotification}
              formatTimestamp={formatTimestamp}
              renderIcon={renderNotificationIcon}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

interface NotificationListProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onRemove: (id: string) => void
  formatTimestamp: (timestamp: Date) => string
  renderIcon: (type: string) => React.ReactNode
}

function NotificationList({
  notifications,
  onMarkAsRead,
  onRemove,
  formatTimestamp,
  renderIcon,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center p-4 text-center">
        <Bell className="mb-2 h-8 w-8 text-blue-300" />
        <p className="text-sm text-blue-600">Nenhuma notificação.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-1 p-1">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-blue-50 ${
              notification.read ? "opacity-70" : "bg-blue-50/50"
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">{renderIcon(notification.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-blue-900">{notification.title}</h4>
                <span className="whitespace-nowrap text-xs text-blue-500">
                  {formatTimestamp(notification.timestamp)}
                </span>
              </div>
              <p className="text-sm text-blue-700">{notification.message}</p>
            </div>
            <div className="flex flex-col gap-1">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onMarkAsRead(notification.id)}
                  title="Marcar como lida"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-500 hover:text-red-600"
                onClick={() => onRemove(notification.id)}
                title="Remover notificação"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

