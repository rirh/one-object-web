import { atom } from "jotai"
export const progressAtom = atom<{ id: string; percent: number } | null>(null)
