import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

/**
 * Verifica se um user é ADMIN de plataforma, tolerante a casing
 * (alguns backends retornam 'admin' lowercase, outros 'ADMIN').
 */
export function isAdmin(user) {
  return String(user?.role || '').toUpperCase() === 'ADMIN';
}
