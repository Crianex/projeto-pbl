<script lang="ts">
    import type { Column } from "../interfaces/column";
    import TableRow from "./TableRow.svelte";

    export let columns: Column[] = [
        { key: "select", label: "", width: "40px" },
        { key: "user", label: "Title", sortable: true, width: "240px" },
        { key: "col1", label: "Title" },
        { key: "col2", label: "Title" },
        { key: "col3", label: "Title" },
        { key: "col4", label: "Title" },
        { key: "badge", label: "Title", width: "100px" },
        { key: "actions", label: "", width: "40px" },
    ];

    export let rows: any[] = [
        {
            id: 1,
            user: {
                name: "Jane Doe",
                role: "Senior Designer",
                avatar: "https://ui-avatars.com/api/?name=Jane+Doe&background=random",
            },
            col1: "Cell Text",
            col2: "Cell Text",
            col3: "Cell Text",
            col4: "Cell Text",
            badge: "Badge",
        },
        {
            id: 2,
            user: {
                name: "Jane Doe",
                role: "Senior Designer",
                avatar: "https://ui-avatars.com/api/?name=Jane+Doe&background=random",
            },
            col1: "Cell Text",
            col2: "Cell Text",
            col3: "Cell Text",
            col4: "Cell Text",
            badge: "Badge",
        },
        {
            id: 3,
            user: {
                name: "Jane Doe",
                role: "Senior Designer",
                avatar: "https://ui-avatars.com/api/?name=Jane+Doe&background=random",
            },
            col1: "Cell Text",
            col2: "Cell Text",
            col3: "Cell Text",
            col4: "Cell Text",
            badge: "Badge",
        },
    ];

    export let enableSelection: boolean = false;
    export let onRowSelect: ((selectedIds: Set<number>) => void) | null = null;

    let selected: Set<number> = new Set();
    let selectAll = false;

    function toggleSelectAll() {
        selectAll = !selectAll;
        if (selectAll) {
            selected = new Set(rows.map((r) => r.id));
        } else {
            selected = new Set();
        }
        onRowSelect?.(selected);
    }

    function toggleSelectRow(id: number) {
        if (selected.has(id)) {
            selected.delete(id);
        } else {
            selected.add(id);
        }
        selected = new Set(selected);
        selectAll = selected.size === rows.length;
        onRowSelect?.(selected);
    }

    // Filter out select column if selection is disabled
    $: displayColumns = enableSelection
        ? columns
        : columns.filter((col) => col.key !== "select");
</script>

<div class="table-container">
    <table>
        <thead>
            <tr>
                {#each displayColumns as col, i}
                    <th
                        class={col.key +
                            (col.key === "select" ? " select" : "") +
                            (col.key === "actions" ? " actions" : "")}
                        style={col.width ? `width:${col.width}` : ""}
                    >
                        {#if col.key === "select"}
                            <input
                                type="checkbox"
                                bind:checked={selectAll}
                                on:change={toggleSelectAll}
                                aria-label="Select all rows"
                            />
                        {:else if col.sortable}
                            {col.label}
                            <span class="sort-icon">↓</span>
                        {:else}
                            {col.label}
                        {/if}
                    </th>
                {/each}
            </tr>
        </thead>
        <tbody>
            {#each rows as row}
                <TableRow
                    columns={displayColumns}
                    {row}
                    selected={selected.has(row.id)}
                    onToggleSelect={enableSelection ? toggleSelectRow : null}
                />
            {/each}
        </tbody>
    </table>
</div>

<style>
    .table-container {
        border: 1px solid #e0e3e8;
        border-radius: 6px;
        overflow: hidden;
        background: #fff;
        font-family: inherit;
    }

    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        min-width: 900px;
    }

    thead {
        background: #f6f8fa;
        color: #21272a;
        font-weight: 600;
        font-size: 15px;
    }

    th {
        padding: 12px 16px;
        border-bottom: 1px solid #e0e3e8;
        text-align: left;
        vertical-align: middle;
        background: #f6f8fa;
        position: relative;
        user-select: none;
        height: auto;
        min-height: auto;
    }

    th.select {
        width: 40px;
        text-align: center;
        padding-left: 8px;
        padding-right: 8px;
    }

    th.actions {
        width: auto;
        text-align: right;
        padding: 8px 16px;
    }

    tbody :global(tr:last-child td) {
        border-bottom: none;
    }

    tbody :global(tr) {
        height: 64px;
    }

    input[type="checkbox"] {
        accent-color: #697077;
        width: 18px;
        height: 18px;
        margin: 0;
    }

    .sort-icon {
        display: inline-block;
        margin-left: 4px;
        vertical-align: middle;
        font-size: 13px;
        color: #697077;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
        table {
            min-width: 700px;
        }

        th {
            padding: 10px 12px;
            font-size: 14px;
        }
    }

    @media (max-width: 768px) {
        .table-container {
            border-radius: 4px;
            overflow-x: auto;
        }

        table {
            min-width: 600px;
        }

        th {
            padding: 8px 10px;
            font-size: 13px;
        }

        th.select {
            width: 35px;
            padding-left: 6px;
            padding-right: 6px;
        }

        th.actions {
            padding: 6px 10px;
        }
    }

    @media (max-width: 480px) {
        .table-container {
            border-radius: 0;
            border-left: none;
            border-right: none;
        }

        table {
            min-width: 500px;
        }

        th {
            padding: 6px 8px;
            font-size: 12px;
        }

        th.select {
            width: 30px;
            padding-left: 4px;
            padding-right: 4px;
        }

        th.actions {
            padding: 4px 8px;
        }

        input[type="checkbox"] {
            width: 16px;
            height: 16px;
        }
    }
</style>
