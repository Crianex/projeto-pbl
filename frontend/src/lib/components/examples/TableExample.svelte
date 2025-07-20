<script lang="ts">
    import Table from "../Table.svelte";
    import type { Column } from "../../interfaces/column";

    // Example 1: Simple data table
    let simpleColumns: Column[] = [
        { key: "name", label: "Name", sortable: true, width: "40%" },
        { key: "email", label: "Email", width: "30%" },
        { key: "status", label: "Status", width: "20%" },
        { key: "actions", label: "Actions", width: "10%" },
    ];

    let simpleRows = [
        {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            status: "Active",
        },
        {
            id: 2,
            name: "Jane Smith",
            email: "jane@example.com",
            status: "Inactive",
            statusClass: "inactive-status", // Custom cell styling
        },
    ];

    // Example 2: User table with avatars
    let userColumns: Column[] = [
        { key: "select", label: "", width: "40px" },
        { key: "user", label: "User", sortable: true, width: "40%" },
        { key: "role", label: "Role", width: "20%" },
        { key: "badge", label: "Department", width: "20%" },
        { key: "actions", label: "", width: "40px" },
    ];

    let userRows = [
        {
            id: 1,
            user: {
                name: "Alice Johnson",
                role: "Senior Developer",
                avatar: "https://ui-avatars.com/api/?name=Alice+Johnson&background=random",
            },
            role: "Developer",
            badge: "Engineering",
        },
        {
            id: 2,
            user: {
                name: "Bob Wilson",
                role: "Product Manager",
                avatar: "https://ui-avatars.com/api/?name=Bob+Wilson&background=random",
            },
            role: "Manager",
            badge: "Product",
        },
    ];

    // Example 3: Table with custom actions
    let actionColumns: Column[] = [
        { key: "name", label: "Product", width: "40%" },
        { key: "price", label: "Price", width: "20%" },
        { key: "stock", label: "Stock", width: "20%" },
        {
            key: "actions",
            label: "Actions",
            width: "20%",
            render: (row: any) => ({
                component: "button",
                props: {
                    variant: row.stock > 0 ? "primary" : "secondary",
                    text: row.stock > 0 ? "Order" : "Out of Stock",
                    onClick: () => handleAction(row.id),
                },
            }),
        },
    ];

    let actionRows = [
        {
            id: 1,
            name: "Laptop",
            price: "$999",
            stock: 5,
        },
        {
            id: 2,
            name: "Mouse",
            price: "$25",
            stock: 0,
        },
    ];

    function handleAction(id: number) {
        console.log("Action for item:", id);
    }

    function handleSelection(selectedIds: Set<number>) {
        console.log("Selected items:", selectedIds);
    }
</script>

<div class="examples-container">
    <h2>Table Component Examples</h2>

    <section>
        <h3>1. Simple Data Table</h3>
        <Table
            columns={simpleColumns}
            rows={simpleRows}
            enableSelection={false}
        />
    </section>

    <section>
        <h3>2. User Table with Selection</h3>
        <Table
            columns={userColumns}
            rows={userRows}
            enableSelection={true}
            onRowSelect={handleSelection}
        />
    </section>

    <section>
        <h3>3. Table with Custom Actions</h3>
        <Table
            columns={actionColumns}
            rows={actionRows}
            enableSelection={false}
        />
    </section>
</div>

<style>
    .examples-container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    section {
        margin-bottom: 3rem;
    }

    h2 {
        color: #333;
        margin-bottom: 2rem;
    }

    h3 {
        color: #555;
        margin-bottom: 1rem;
    }

    /* Custom styling for inactive status */
    :global(.inactive-status) {
        color: #dc3545;
        font-weight: 500;
    }
</style>
