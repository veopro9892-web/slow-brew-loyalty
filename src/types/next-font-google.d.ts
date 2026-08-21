declare module 'next/font/google' {
  import type { NextFont } from 'next';
  export function Geist(options: {
    subsets?: string[];
    variable?: string;
    weight?: string | string[];
    display?: string;
  }): NextFont;
}

declare module 'next/headers' {
  export function cookies(): Promise<{ get: (name: string) => { value: string } | undefined }>;
}
