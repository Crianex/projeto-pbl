import { writable } from "svelte/store";

export interface DropdownData {
    id: string;
    options: Array<{ value: any; label: string }>;
    value: any;
    position: { top: number; left: number; width: number };
    onSelect: (option: { value: any; label: string }) => void;
    onClose: () => void;
}

// Shared store for managing active dropdowns
export const activeDropdowns = writable<Map<string, DropdownData>>(new Map());
