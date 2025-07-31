<script lang="ts">
    // No props needed - this is static content
</script>

<div class="matrix-legend">
    <h4>Legenda:</h4>
    <ul>
        <li>
            <strong>Número:</strong> Identificação numérica do aluno na matriz
        </li>
        <li>
            <strong>Média:</strong> Média das avaliações dos colegas (10 pontos)
            - calculada usando a nova lógica
        </li>
        <li>
            <strong>Prof.:</strong> Nota do professor (10 pontos) - inclui avaliação
            dos critérios e arquivos
        </li>
        <li>
            <strong>Auto:</strong> Auto-avaliação do aluno (10 pontos)
        </li>
        <li>
            <strong>Pares:</strong> Média das avaliações dos colegas (10 pontos)
        </li>
        <li>
            <strong>Total:</strong> Soma final (30 pontos) = Prof. + Auto + Pares
        </li>
        <li>
            <strong>Colunas numeradas (1, 2, 3...):</strong> Notas dadas para cada
            aluno (identificado pelo número)
        </li>
        <li>
            <strong>N:</strong> Avaliação não enviada para o colega
        </li>
        <li>
            <span style="background:#ffcccc;padding:2px 8px;border-radius:4px;"
                >&nbsp;</span
            > Nota zero enviada
        </li>
        <li>
            <span style="background:#fff9c4;padding:2px 8px;border-radius:4px;"
                >&nbsp;</span
            > Nota fora do padrão dos colegas
        </li>
        <li>
            <span
                style="background:#e3fbec;padding:2px 8px;border-radius:4px;color:#168f41;font-weight:600;"
                >&nbsp;</span
            > Auto-avaliação realizada
        </li>
    </ul>
</div>

<style>
    .matrix-legend {
        margin-top: 0.7rem;
        padding: 0.4rem 0.7rem;
        background: #f8fafc;
        border: 1px solid #e3e6ed;
        border-radius: 6px;
        font-size: 0.93rem;
        color: #495057;
        box-shadow: none;
    }

    .matrix-legend h4 {
        margin: 0 0 0.4rem 0;
        color: #22223b;
        font-size: 0.97rem;
        font-weight: 700;
    }

    .matrix-legend ul {
        margin: 0;
        padding-left: 1rem;
    }

    .matrix-legend li {
        margin-bottom: 0.2rem;
        color: #495057;
        line-height: 1.4;
    }

    .matrix-legend li:last-child {
        margin-bottom: 0;
    }

    @media (max-width: 768px) {
        .matrix-legend {
            padding: 0.2rem 0.1rem;
            font-size: 0.9rem;
        }
    }

    @media (max-width: 480px) {
        .matrix-legend {
            padding: 0.08rem 0.02rem;
        }
    }
</style>
