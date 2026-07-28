export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string) => [...notificationKeys.all, userId] as const,
  unreadCount: (userId: string) => [...notificationKeys.list(userId), 'unread-count'] as const,
} as const
