import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Concatène des classes Tailwind en résolvant les conflits : la dernière
 * classe d'une même famille l'emporte (`px-4` puis `px-6` donne `px-6`),
 * ce qu'une simple concaténation ne sait pas faire. Indispensable dès
 * qu'un composant accepte un `className` qui doit pouvoir écraser ses
 * propres valeurs par défaut.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
