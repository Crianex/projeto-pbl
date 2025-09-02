

export type RenderObject = {
    component: string;
    props: Record<string, any>;
};

export interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: "left" | "center" | "right";
    render?: (row: any) => RenderObject | RenderObject[] | string;
    tooltip?: string; // Tooltip for column header
}