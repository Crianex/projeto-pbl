<script lang="ts">
    import Table from "../Table.svelte";
    import type { Column } from "../../interfaces/column";

    // Example 1: Simple data table
    let simpleColumns: Column[] = [
        { key: "name", label: "Nome", sortable: true, width: "40%" },
        { key: "email", label: "Email", width: "30%" },
        { key: "status", label: "Status", width: "20%" },
        { key: "actions", label: "Ações", width: "10%" },
    ];

    let simpleRows = [
        {
            id: 1,
            name: "João Silva",
            email: "joao@exemplo.com",
            status: "Ativo",
        },
        {
            id: 2,
            name: "Maria Santos",
            email: "maria@exemplo.com",
            status: "Inativo",
            statusClass: "inactive-status",
        },
        {
            id: 3,
            name: "Pedro Costa",
            email: "pedro@exemplo.com",
            status: "Ativo",
        },
        {
            id: 4,
            name: "Ana Oliveira",
            email: "ana@exemplo.com",
            status: "Pendente",
            statusClass: "pending-status",
        },
    ];

    // Example 2: User table with avatars
    let userColumns: Column[] = [
        { key: "select", label: "", width: "40px" },
        { key: "user", label: "Usuário", sortable: true, width: "40%" },
        { key: "role", label: "Cargo", width: "20%" },
        { key: "department", label: "Departamento", width: "20%" },
        { key: "badge", label: "Status", width: "15%" },
        { key: "actions", label: "", width: "40px" },
    ];

    let userRows = [
        {
            id: 1,
            user: {
                name: "Alice Johnson",
                role: "Desenvolvedora Senior",
                avatar: "https://ui-avatars.com/api/?name=Alice+Johnson&background=random",
            },
            role: "Desenvolvedora",
            department: "Engenharia",
            badge: "Ativo",
        },
        {
            id: 2,
            user: {
                name: "Bob Wilson",
                role: "Gerente de Produto",
                avatar: "https://ui-avatars.com/api/?name=Bob+Wilson&background=random",
            },
            role: "Gerente",
            department: "Produto",
            badge: "Ativo",
        },
        {
            id: 3,
            user: {
                name: "Carol Davis",
                role: "Designer UX/UI",
                avatar: "https://ui-avatars.com/api/?name=Carol+Davis&background=random",
            },
            role: "Designer",
            department: "Design",
            badge: "Férias",
        },
        {
            id: 4,
            user: {
                name: "David Brown",
                role: "Analista de QA",
                avatar: "https://ui-avatars.com/api/?name=David+Brown&background=random",
            },
            role: "Analista",
            department: "Qualidade",
            badge: "Ativo",
        },
    ];

    // Example 3: Table with custom actions
    let actionColumns: Column[] = [
        { key: "name", label: "Produto", width: "40%" },
        { key: "price", label: "Preço", width: "20%" },
        { key: "stock", label: "Estoque", width: "20%" },
        {
            key: "actions",
            label: "Ações",
            width: "20%",
            render: (row: any) => ({
                component: "button",
                props: {
                    variant: row.stock > 0 ? "primary" : "secondary",
                    text: row.stock > 0 ? "Comprar" : "Sem Estoque",
                    onClick: () => handleAction(row.id),
                },
            }),
        },
    ];

    let actionRows = [
        {
            id: 1,
            name: "Laptop Dell Inspiron",
            price: "R$ 3.999",
            stock: 5,
        },
        {
            id: 2,
            name: "Mouse Wireless",
            price: "R$ 89",
            stock: 0,
        },
        {
            id: 3,
            name: "Teclado Mecânico",
            price: "R$ 299",
            stock: 12,
        },
        {
            id: 4,
            name: "Monitor 24\"",
            price: "R$ 799",
            stock: 3,
        },
    ];

    function handleAction(id: number) {
        console.log("Ação para item:", id);
        alert(`Ação executada para o item ${id}`);
    }

    function handleSelection(selectedIds: Set<number>) {
        console.log("Itens selecionados:", selectedIds);
        alert(`Selecionados: ${Array.from(selectedIds).join(", ")}`);
    }
</script>

<div class="examples-container">
    <h2>Exemplos do Componente Table</h2>
    <p class="description">
        Redimensione a janela para ver como a tabela se transforma em cards no mobile.
    </p>

    <section>
        <h3>1. Tabela Simples de Dados</h3>
        <Table
            columns={simpleColumns}
            rows={simpleRows}
            enableSelection={false}
        />
    </section>

    <section>
        <h3>2. Tabela de Usuários com Seleção</h3>
        <Table
            columns={userColumns}
            rows={userRows}
            enableSelection={true}
            onRowSelect={handleSelection}
        />
    </section>

    <section>
        <h3>3. Tabela com Ações Personalizadas</h3>
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

    .description {
        color: #666;
        margin-bottom: 2rem;
        font-style: italic;
    }

    section {
        margin-bottom: 3rem;
    }

    h2 {
        color: #333;
        margin-bottom: 1rem;
    }

    h3 {
        color: #555;
        margin-bottom: 1rem;
    }

    /* Custom styling for status */
    :global(.inactive-status) {
        color: #dc3545;
        font-weight: 500;
    }

    :global(.pending-status) {
        color: #ffc107;
        font-weight: 500;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .examples-container {
            padding: 1rem 0.5rem;
            margin: 0;
            max-width: none;
        }

        h2 {
            font-size: 1.5rem;
            padding: 0 0.5rem;
        }

        h3 {
            font-size: 1.2rem;
            padding: 0 0.5rem;
        }

        .description {
            padding: 0 0.5rem;
        }

        section {
            margin-bottom: 2rem;
        }
    }

    @media (max-width: 480px) {
        .examples-container {
            padding: 0.5rem 0.25rem;
        }

        h2 {
            font-size: 1.3rem;
            padding: 0 0.25rem;
        }

        h3 {
            font-size: 1.1rem;
            padding: 0 0.25rem;
        }

        .description {
            padding: 0 0.25rem;
        }
    }
</style>
