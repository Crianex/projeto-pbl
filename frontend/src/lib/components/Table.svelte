<script lang="ts">
    import type { Column } from "../interfaces/column";

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

    let selected: Set<number> = new Set();
    let selectAll = false;

    function toggleSelectAll() {
        selectAll = !selectAll;
        if (selectAll) {
            selected = new Set(rows.map((r) => r.id));
        } else {
            selected = new Set();
        }
    }

    function toggleSelectRow(id: number) {
        if (selected.has(id)) {
            selected.delete(id);
        } else {
            selected.add(id);
        }
        selected = new Set(selected);
        selectAll = selected.size === rows.length;
    }
</script>

<div class="table-container">
    <table>
        <thead>
            <tr>
                {#each columns as col, i}
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
                <tr>
                    {#each columns as col}
                        <td
                            class={col.key +
                                (col.key === "select" ? " select" : "") +
                                (col.key === "actions" ? " actions" : "")}
                        >
                            {#if col.key === "select"}
                                <input
                                    type="checkbox"
                                    checked={selected.has(row.id)}
                                    on:change={() => toggleSelectRow(row.id)}
                                    aria-label="Select row"
                                />
                            {:else if col.key === "user"}
                                <div class="user-cell">
                                    <img
                                        class="avatar"
                                        src={row.user.avatar}
                                        alt={row.user.name}
                                    />
                                    <div class="user-info">
                                        <span class="user-name"
                                            >{row.user.name}</span
                                        >
                                        <span class="user-role"
                                            >{row.user.role}</span
                                        >
                                    </div>
                                </div>
                            {:else if col.key === "badge"}
                                <span class="badge">{row.badge}</span>
                            {:else if col.key === "actions"}
                                <span class="ellipsis" title="Actions"
                                    >&#x22EE;</span
                                >
                            {:else}
                                {row[col.key]}
                            {/if}
                        </td>
                    {/each}
                </tr>
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
    th,
    td {
        padding: 12px 16px;
        border-bottom: 1px solid #e0e3e8;
        text-align: left;
        vertical-align: middle;
        background: #fff;
    }
    th {
        background: #f6f8fa;
        position: relative;
        user-select: none;
    }
    th.select,
    td.select {
        width: 40px;
        text-align: center;
        padding-left: 8px;
        padding-right: 8px;
    }
    th.actions,
    td.actions {
        width: 40px;
        text-align: center;
        padding-left: 8px;
        padding-right: 8px;
    }
    .user-cell {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        border: 1.5px solid #dde1e6;
    }
    .user-info {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
    }
    .user-name {
        font-weight: 600;
        color: #121619;
        font-size: 15px;
    }
    .user-role {
        color: #697077;
        font-size: 13px;
    }
    .badge {
        display: inline-block;
        background: #f2f4f8;
        color: #697077;
        font-size: 13px;
        border-radius: 8px;
        padding: 2px 12px;
        font-weight: 500;
        min-width: 48px;
        text-align: center;
    }
    .ellipsis {
        font-size: 22px;
        color: #697077;
        cursor: pointer;
        padding: 0 4px;
    }
    tr:last-child td {
        border-bottom: none;
    }
    tr {
        transition: background 0.12s;
    }
    tr:hover {
        background: #f6f8fa;
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
</style>
