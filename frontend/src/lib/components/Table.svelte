<!--
  Table Component - Responsive Table with Mobile Card View
  
  Features:
  - Desktop: Traditional table layout
  - Mobile (≤768px): Card-based layout with all row data displayed as fields
  - Selection support with checkboxes
  - Custom column rendering
  - User avatar support
  - Badge support
  - Action buttons
  
  Usage:
  <Table 
    columns={columns} 
    rows={rows} 
    enableSelection={true} 
    onRowSelect={handleSelection} 
  />
  
  Mobile Behavior:
  - Automatically switches to card view on screens ≤768px
  - Each row becomes a card with labeled fields
  - Actions are moved to bottom of card
  - Selection checkboxes appear in card header
-->

<script lang="ts">
    import type { Column } from "../interfaces/column";
    import TableRow from "./TableRow.svelte";
    import Button from "./Button.svelte";

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
    export let loading: boolean = false;
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

    // Create skeleton rows for loading state
    $: skeletonRows = Array(5)
        .fill(null)
        .map((_, index) => ({
            id: `skeleton-${index}`,
            skeleton: true,
        }));
</script>

<!-- Desktop Table View -->
<div class="table-container desktop-view">
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
                                disabled={loading}
                            />
                        {:else if col.sortable}
                            <div class="header-content">
                                <span class="header-label">{col.label}</span>
                                {#if col.tooltip}
                                    <span class="tooltip-container">
                                        <span class="tooltip-icon">ℹ️</span>
                                        <div class="tooltip-text">
                                            {col.tooltip}
                                        </div>
                                    </span>
                                {/if}
                                <span class="sort-icon">↓</span>
                            </div>
                        {:else}
                            <div class="header-content">
                                <span class="header-label">{col.label}</span>
                                {#if col.tooltip}
                                    <span class="tooltip-container">
                                        <span class="tooltip-icon">ℹ️</span>
                                        <div class="tooltip-text">
                                            {col.tooltip}
                                        </div>
                                    </span>
                                {/if}
                            </div>
                        {/if}
                    </th>
                {/each}
            </tr>
        </thead>
        <tbody>
            {#if loading}
                {#each skeletonRows as skeletonRow}
                    <tr class="skeleton-row">
                        {#each displayColumns as col}
                            <td class="skeleton-cell">
                                {#if col.key === "select"}
                                    <div class="skeleton-checkbox"></div>
                                {:else if col.key === "user"}
                                    <div class="skeleton-user">
                                        <div class="skeleton-avatar"></div>
                                        <div class="skeleton-text-group">
                                            <div
                                                class="skeleton-text skeleton-name"
                                            ></div>
                                            <div
                                                class="skeleton-text skeleton-role"
                                            ></div>
                                        </div>
                                    </div>
                                {:else if col.key === "actions"}
                                    <div class="skeleton-button"></div>
                                {:else}
                                    <div class="skeleton-text"></div>
                                {/if}
                            </td>
                        {/each}
                    </tr>
                {/each}
            {:else}
                {#each rows as row}
                    <TableRow
                        columns={displayColumns}
                        {row}
                        selected={selected.has(row.id)}
                        onToggleSelect={enableSelection
                            ? toggleSelectRow
                            : null}
                    />
                {/each}
            {/if}
        </tbody>
    </table>
</div>

<!-- Mobile Card View -->
<div class="mobile-view">
    {#each rows as row}
        <div class="card-item">
            {#if enableSelection}
                <div class="card-header">
                    <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        on:change={() => toggleSelectRow(row.id)}
                        aria-label="Select row"
                    />
                </div>
            {/if}

            <div class="card-content">
                {#each displayColumns as col}
                    {#if col.key !== "select" && col.key !== "actions"}
                        <div class="card-field">
                            <div class="field-label">{col.label}</div>
                            <div class="field-value">
                                {#if col.key === "user"}
                                    <div class="user-cell">
                                        <img
                                            class="avatar"
                                            src={row.user?.link_avatar ||
                                                row.user?.avatar ||
                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(row.user?.name || "User")}&background=random`}
                                            alt={row.user?.name || "User"}
                                        />
                                        <div class="user-info">
                                            <span class="user-name"
                                                >{row.user?.name || ""}</span
                                            >
                                            <span class="user-role"
                                                >{row.user?.role || ""}</span
                                            >
                                        </div>
                                    </div>
                                {:else if col.key === "badge"}
                                    <span class="badge">{row.badge || ""}</span>
                                {:else if col.render}
                                    {@const renderResult = col.render(row)}
                                    {#if Array.isArray(renderResult)}
                                        {#each renderResult as item}
                                            {#if typeof item === "string"}
                                                {item}
                                            {:else if item && typeof item === "object" && "component" in item && item.component === "a"}
                                                <Button
                                                    variant={item.props
                                                        .variant || "primary"}
                                                    href={item.props.href}
                                                    class={item.props.class ||
                                                        ""}
                                                >
                                                    {item.props.textContent ||
                                                        item.props.text ||
                                                        ""}
                                                </Button>
                                            {:else if item && typeof item === "object" && (item.component === "button" || item.component === "Button")}
                                                <Button
                                                    variant={item.props
                                                        .variant || "primary"}
                                                    class={item.props.class ||
                                                        ""}
                                                    on:click={item.props
                                                        .onClick}
                                                >
                                                    {typeof item.props.text ===
                                                    "string"
                                                        ? item.props.text
                                                        : String(
                                                              item.props.text ||
                                                                  "",
                                                          )}
                                                </Button>
                                            {:else if item && typeof item === "object" && item.component === "span"}
                                                <span
                                                    class={item.props.class ||
                                                        ""}
                                                >
                                                    {typeof item.props.text ===
                                                    "string"
                                                        ? item.props.text
                                                        : String(
                                                              item.props.text ||
                                                                  "",
                                                          )}
                                                </span>
                                            {:else if item && typeof item === "object" && item.component === "html"}
                                                {@html item.props.html}
                                            {:else}
                                                {@html item}
                                            {/if}
                                        {/each}
                                    {:else if typeof renderResult === "string"}
                                        {renderResult}
                                    {:else if renderResult && typeof renderResult === "object" && renderResult.component === "a"}
                                        <Button
                                            variant={renderResult.props
                                                .variant || "primary"}
                                            href={renderResult.props.href}
                                            class={renderResult.props.class ||
                                                ""}
                                        >
                                            {renderResult.props.textContent ||
                                                renderResult.props.text ||
                                                ""}
                                        </Button>
                                    {:else if renderResult && typeof renderResult === "object" && (renderResult.component === "button" || renderResult.component === "Button")}
                                        <Button
                                            variant={renderResult.props
                                                .variant || "primary"}
                                            class={renderResult.props.class ||
                                                ""}
                                            on:click={renderResult.props
                                                .onClick}
                                        >
                                            {typeof renderResult.props.text ===
                                            "string"
                                                ? renderResult.props.text
                                                : String(
                                                      renderResult.props.text ||
                                                          "",
                                                  )}
                                        </Button>
                                    {:else if renderResult && typeof renderResult === "object" && renderResult.component === "span"}
                                        <span
                                            class={renderResult.props.class ||
                                                ""}
                                        >
                                            {typeof renderResult.props.text ===
                                            "string"
                                                ? renderResult.props.text
                                                : String(
                                                      renderResult.props.text ||
                                                          "",
                                                  )}
                                        </span>
                                    {:else if renderResult && typeof renderResult === "object" && renderResult.component === "html"}
                                        {@html renderResult.props.html}
                                    {:else}
                                        {@html renderResult}
                                    {/if}
                                {:else}
                                    {row[col.key] || ""}
                                {/if}
                            </div>
                        </div>
                    {/if}
                {/each}

                {#if displayColumns.find((col) => col.key === "actions")}
                    <div class="card-actions">
                        {#each displayColumns as col}
                            {#if col.key === "actions" && col.render}
                                {@const renderResult = col.render(row)}
                                {#if typeof renderResult === "string"}
                                    {@html renderResult}
                                {:else if typeof renderResult === "object" && "component" in renderResult}
                                    {#if renderResult.component === "a"}
                                        <Button
                                            variant={renderResult.props
                                                .variant || "primary"}
                                            href={renderResult.props.href}
                                            class={renderResult.props.class ||
                                                ""}
                                        >
                                            {renderResult.props.textContent ||
                                                renderResult.props.text ||
                                                ""}
                                        </Button>
                                    {:else if renderResult.component === "button" || renderResult.component === "Button"}
                                        <Button
                                            variant={renderResult.props
                                                .variant || "primary"}
                                            class={renderResult.props.class ||
                                                ""}
                                            on:click={() => {
                                                if (
                                                    renderResult?.props?.onClick
                                                ) {
                                                    renderResult.props.onClick();
                                                }
                                            }}
                                        >
                                            {typeof renderResult.props.text ===
                                            "string"
                                                ? renderResult.props.text
                                                : String(
                                                      renderResult.props.text ||
                                                          "",
                                                  )}
                                        </Button>
                                    {:else if renderResult.component === "span"}
                                        <span
                                            class={renderResult.props.class ||
                                                ""}
                                        >
                                            {typeof renderResult.props.text ===
                                            "string"
                                                ? renderResult.props.text
                                                : String(
                                                      renderResult.props.text ||
                                                          "",
                                                  )}
                                        </span>
                                    {/if}
                                {/if}
                            {/if}
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    {/each}
</div>

<style>
    .table-container {
        border: 1px solid #e0e3e8;
        border-radius: 6px;
        overflow: visible;
        background: #fff;
        font-family: inherit;
        position: relative;
    }

    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
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

    /* Header content and tooltip styles */
    .header-content {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .tooltip-container {
        position: relative;
        display: inline-flex;
        align-items: center;
    }

    .tooltip-icon {
        font-size: 12px;
        cursor: help;
        opacity: 0.6;
        transition: opacity 0.2s;
    }

    .tooltip-icon:hover {
        opacity: 1;
    }

    .tooltip-text {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #1a1a1a;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: normal;
        white-space: pre-wrap;
        max-width: 300px;
        min-width: 200px;
        text-align: left;
        line-height: 1.4;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        margin-bottom: 5px;
        visibility: hidden;
        opacity: 0;
        transition:
            opacity 0.2s,
            visibility 0.2s;
        pointer-events: none;
    }

    .tooltip-text::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: #1a1a1a;
    }

    .tooltip-container:hover .tooltip-text {
        visibility: visible;
        opacity: 1;
    }

    /* Mobile Card Styles */
    .mobile-view {
        display: none;
    }

    .card-item {
        background: #fff;
        border: 1px solid #e0e3e8;
        border-radius: 8px;
        margin-bottom: 12px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .card-header {
        padding: 12px 16px;
        background: #f6f8fa;
        border-bottom: 1px solid #e0e3e8;
        display: flex;
        align-items: center;
    }

    .card-content {
        padding: 16px;
    }

    .card-field {
        margin-bottom: 16px;
    }

    .card-field:last-child {
        margin-bottom: 0;
    }

    .field-label {
        font-weight: 600;
        color: #697077;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
    }

    .field-value {
        color: #121619;
        font-size: 14px;
        line-height: 1.4;
    }

    .card-actions {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e0e3e8;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    }

    /* Mobile User Cell Styles */
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
        flex-shrink: 0;
    }

    .user-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
        line-height: 1.3;
    }

    .user-name {
        font-weight: 600;
        color: #121619;
        font-size: 16px;
        margin: 0;
        line-height: 1.2;
    }

    .user-role {
        color: #697077;
        font-size: 14px;
        margin: 2px 0 0 0;
        line-height: 1.2;
    }

    .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #f2f4f8;
        color: #697077;
        font-size: 13px;
        border-radius: 8px;
        padding: 4px 12px;
        font-weight: 500;
        min-width: 48px;
        height: 24px;
        text-align: center;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
        table {
        }

        th {
            padding: 10px 12px;
            font-size: 14px;
        }
    }

    @media (max-width: 768px) {
        .desktop-view {
            display: none;
        }

        .mobile-view {
            display: block;
            margin: 0 -1rem; /* Remove margens laterais para ocupar toda a largura */
            padding: 0 1rem; /* Adiciona padding interno para manter espaçamento do conteúdo */
        }

        .card-item {
            margin-bottom: 8px;
            border-radius: 6px;
            border-left: none;
            border-right: none;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .card-content {
            padding: 16px 12px;
        }

        .card-field {
            margin-bottom: 14px;
        }

        .field-label {
            font-size: 11px;
            margin-bottom: 6px;
        }

        .field-value {
            font-size: 15px;
            line-height: 1.5;
        }

        .user-name {
            font-size: 16px;
        }

        .user-role {
            font-size: 14px;
        }

        .avatar {
            width: 44px;
            height: 44px;
        }

        .card-actions {
            margin-top: 14px;
            padding-top: 14px;
        }

        .badge {
            font-size: 14px;
            padding: 6px 14px;
            height: 28px;
        }
    }

    @media (max-width: 480px) {
        .mobile-view {
            margin: 0 -0.5rem; /* Reduz margens negativas */
            padding: 0 0.5rem; /* Reduz padding interno */
        }

        .card-item {
            margin-bottom: 6px;
            border-radius: 4px;
        }

        .card-content {
            padding: 14px 10px;
        }

        .card-field {
            margin-bottom: 12px;
        }

        .field-label {
            font-size: 10px;
            margin-bottom: 5px;
        }

        .field-value {
            font-size: 14px;
        }

        .user-name {
            font-size: 15px;
        }

        .user-role {
            font-size: 13px;
        }

        .avatar {
            width: 40px;
            height: 40px;
        }

        .card-actions {
            margin-top: 12px;
            padding-top: 12px;
        }

        .badge {
            font-size: 13px;
            padding: 5px 12px;
            height: 26px;
        }

        input[type="checkbox"] {
            width: 16px;
            height: 16px;
        }
    }
</style>
