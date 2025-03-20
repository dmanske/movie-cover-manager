"use client"

import { useState, useCallback, useEffect } from "react"

export interface Notification {
  id: string
  title: string
  message: string
  type: "success" | "warning" | "error" | "info"
  timestamp: Date
  read?: boolean
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Load notifications from localStorage on mount
  useEffect(() => {
    const storedNotifications = localStorage.getItem("notifications")
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications)
        // Convert string timestamps back to Date objects
        const formattedNotifications = parsedNotifications.map((notification: any) => ({
          ...notification,
          timestamp: new Date(notification.timestamp),
        }))
        setNotifications(formattedNotifications)
      } catch (error) {
        console.error("Failed to parse notifications:", error)
      }
    }
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem("notifications", JSON.stringify(notifications))
    }
  }, [notifications])

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 50)) // Keep only the 50 most recent notifications

    // Removendo a tentativa de reproduzir som para evitar o erro
    // Não tentaremos reproduzir um som de notificação, já que não temos o arquivo
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
    localStorage.removeItem("notifications")
  }, [])

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  }
}

