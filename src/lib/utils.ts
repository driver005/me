import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shuffles an array in place.
 * @param array - The array to shuffle.
 * @returns The shuffled array.
 */
export function shuffle_array<T>(array: T[]) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

/**
 * Shadcn-svelte utility types
 */
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

export type WithElementRef<E extends Record<string, any>, R extends HTMLElement = HTMLElement> = Omit<E, 'ref'> & {
  ref?: R | null;
};

export type WithoutChildren<T> = T & { children?: never };

export type WithoutChildrenOrChild<T> = Omit<T, 'children' | 'child'>;
