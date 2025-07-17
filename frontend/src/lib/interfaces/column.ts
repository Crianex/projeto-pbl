

export interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: "left" | "center" | "right";
    render?: (row: any) => any;
}