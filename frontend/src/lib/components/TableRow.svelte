<script lang="ts">
    import type { Column } from "../interfaces/column";
    import Button from "./Button.svelte";

    export let columns: Column[] = [];
    export let row: any = {};
    export let selected: boolean = false;
    export let onToggleSelect: ((id: number) => void) | null = null;

    function handleCellClick(col: Column, row: any) {
        if (col.render && typeof col.render === "function") {
            const renderResult = col.render(row);
            if (renderResult?.props?.onClick) {
                renderResult.props.onClick();
            }
        }
    }
</script>

<tr class={row.rowClass || ""}>
    {#each columns as col}
        <td
            class={col.key +
                (col.key === "select" ? " select" : "") +
                (col.key === "actions" ? " actions" : "") +
                (row[col.key + "Class"] ? ` ${row[col.key + "Class"]}` : "")}
        >
            {#if col.key === "select"}
                <input
                    type="checkbox"
                    checked={selected}
                    on:change={() => onToggleSelect?.(row.id)}
                    aria-label="Select row"
                />
            {:else if col.key === "user"}
                <div class="user-cell">
                    <img
                        class="avatar"
                        src={row.user?.link_avatar ||
                            row.user?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(row.user?.name || "User")}&background=random`}
                        alt={row.user?.name || "User"}
                    />
                    <div class="user-info">
                        <span class="user-name">{row.user?.name || ""}</span>
                        <span class="user-role">{row.user?.role || ""}</span>
                    </div>
                </div>
            {:else if col.key === "badge"}
                <span class="badge">{row.badge || ""}</span>
            {:else if col.render}
                {@const renderResult = col.render(row)}
                {#if renderResult.component === "a"}
                    <Button
                        variant={renderResult.props.variant || "primary"}
                        href={renderResult.props.href}
                        class={renderResult.props.class || ""}
                    >
                        {renderResult.props.textContent ||
                            renderResult.props.text ||
                            ""}
                    </Button>
                {:else if renderResult.component === "button" || renderResult.component === "Button"}
                    <Button
                        variant={renderResult.props.variant || "primary"}
                        class={renderResult.props.class || ""}
                        on:click={() => handleCellClick(col, row)}
                    >
                        {typeof renderResult.props.text === "string"
                            ? renderResult.props.text
                            : String(renderResult.props.text || "")}
                    </Button>
                {:else if renderResult.component === "span"}
                    <span class={renderResult.props.class || ""}>
                        {typeof renderResult.props.text === "string"
                            ? renderResult.props.text
                            : String(renderResult.props.text || "")}
                    </span>
                {:else}
                    {@html renderResult}
                {/if}
            {:else if col.key === "actions"}
                <span class="ellipsis" title="Actions">&#x22EE;</span>
            {:else}
                {row[col.key] || ""}
            {/if}
        </td>
    {/each}
</tr>

<style>
    tr {
        transition: background 0.12s;
    }

    tr:hover {
        background: #f6f8fa;
    }

    td {
        padding: 12px 16px;
        border-bottom: 1px solid #e0e3e8;
        text-align: left;
        vertical-align: middle;
        background: #fff;
        height: 64px;
        min-height: 64px;
        box-sizing: border-box;
    }

    td.select {
        width: 40px;
        text-align: center;
        padding-left: 8px;
        padding-right: 8px;
    }

    td.actions {
        width: auto;
        text-align: right;
        padding: 8px 16px;
    }

    .user-cell {
        display: flex;
        align-items: center;
        gap: 12px;
        height: 100%;
        min-height: 40px;
    }

    .avatar {
        width: 32px;
        height: 32px;
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
        min-height: 32px;
        flex: 1;
    }

    .user-name {
        font-weight: 600;
        color: #121619;
        font-size: 15px;
        margin: 0;
        line-height: 1.2;
    }

    .user-role {
        color: #697077;
        font-size: 13px;
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

    .ellipsis {
        font-size: 22px;
        color: #697077;
        cursor: pointer;
        padding: 0 4px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }

    input[type="checkbox"] {
        accent-color: var(--color-text-muted);
        width: 18px;
        height: 18px;
        margin: 0;
    }

    /* Button styles for actions column */
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        border: 1px solid;
        cursor: pointer;
        transition: all 0.2s ease;
        min-height: 36px;
    }

    .btn-primary {
        background-color: var(--color-info-main);
        border-color: var(--color-info-main);
        color: var(--color-text-white);
    }

    .btn-primary:hover {
        background-color: var(--color-info-dark);
        border-color: var(--color-info-dark);
    }

    .btn-secondary {
        background-color: var(--color-bg-white);
        border-color: var(--color-border-main);
        color: var(--color-text-secondary);
    }

    .btn-secondary:hover {
        background-color: var(--color-bg-light);
        border-color: var(--color-text-light);
    }

    /* Self-evaluation styling */
    tr.self-evaluation {
        background-color: var(--color-bg-light) !important;
        border-left: 4px solid var(--color-info-main);
    }

    tr.self-evaluation:hover {
        background-color: var(--color-bg-neutral) !important;
    }

    /* Not evaluated styling */
    td.nao-avaliado {
        color: var(--color-text-muted);
        font-style: italic;
    }

    /* Grade styling */
    .grade {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 3rem;
        height: 2rem;
        background: var(--color-primary-gradient);
        color: var(--color-text-white);
        font-weight: 600;
        padding: 0 0.75rem;
        border-radius: 8px;
        box-shadow:
            0 4px 12px var(--color-shadow-primary),
            inset 0 1px 0 var(--color-glass-border);
    }

    /* Responsive Design - Only for desktop table adjustments */
    @media (max-width: 1024px) {
        td {
            padding: 10px 12px;
            font-size: 14px;
        }

        .user-cell {
            gap: 0.75rem;
        }

        .avatar {
            width: 36px;
            height: 36px;
        }

        .user-name {
            font-size: 14px;
        }

        .user-role {
            font-size: 12px;
        }
    }
</style>
