export const shellKeys = {
  all: ['shell'] as const,
  users: () => [...shellKeys.all, 'users'] as const,
  user: (userId: string) => [...shellKeys.all, 'user', userId] as const,
  cart: (userId: string) => [...shellKeys.all, 'cart', userId] as const,
  orders: (userId: string) => [...shellKeys.all, 'orders', userId] as const,
  forUser: (userId: string) => [...shellKeys.all, userId] as const,
}
