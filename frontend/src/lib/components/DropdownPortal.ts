import { writable } from "svelte/store";

export interface DropdownData {
    id: string;
    options: Array<{ value: any; label: string }>;
    value: any;
    position: { top: number; left: number; width: number };
    onSelect: (option: { value: any; label: string }, isShiftClick?: boolean) => void;
    onClose: () => void;
    isMultiSelect?: boolean;
    selectedValues?: any[];
    isAllSelected?: boolean;
    isPartiallySelected?: boolean;
}

// Shared store for managing active dropdowns
export const activeDropdowns = writable<Map<string, DropdownData>>(new Map());
