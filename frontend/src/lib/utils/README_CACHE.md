# Enhanced Cache System Documentation

This document explains the new comprehensive cache invalidation system implemented in the PBL frontend application.

## Overview

The enhanced cache system automatically manages data consistency across all components by invalidating related caches whenever data changes. This ensures that when you create, update, or delete turmas, problemas, alunos, avaliacoes, or professors, all relevant cached data is automatically refreshed.

## Key Features

### 1. Automatic Cache Invalidation
- **Relationship-aware**: When a turma is deleted, all related problemas and avaliacoes are also invalidated
- **Cross-entity**: Updating an aluno automatically invalidates the turma cache they belong to
- **Comprehensive**: All CRUD operations trigger appropriate cache invalidations

### 2. Enhanced Services
All services now include complete CRUD operations with built-in cache invalidation:

#### TurmasService
```typescript
import { TurmasService } from "$lib/services/turmas_service";

// All operations automatically handle cache invalidation
await TurmasService.create({ nome_turma: "Nova Turma", id_professor: 1 });
await TurmasService.update("123", { nome_turma: "Turma Atualizada" });
await TurmasService.delete("123");
await TurmasService.addAluno("123", 456);
await TurmasService.removeAluno("123", 456);
```

#### ProblemasService
```typescript
import { ProblemasService } from "$lib/services/problemas_service";

await ProblemasService.create({
    nome_problema: "Novo Problema",
    data_inicio: "2024-01-01",
    data_fim: "2024-01-31",
    id_turma: 123,
    criterios: JSON.stringify(criterios)
});
await ProblemasService.update("456", problemaData);
await ProblemasService.delete("456", "123");
```

#### AlunosService
```typescript
import { AlunosService } from "$lib/services/alunos_service";

await AlunosService.create({ nome_completo: "João Silva", email: "joao@email.com" });
await AlunosService.update(alunoModel);
await AlunosService.delete("123", "456"); // alunoId, turmaId (optional)
```

#### ProfessoresService
```typescript
import { ProfessoresService } from "$lib/services/professores_service";

await ProfessoresService.update(professorModel);
```

#### AvaliacoesService
```typescript
import { AvaliacoesService } from "$lib/services/avaliacoes_service";

await AvaliacoesService.create({
    id_problema: 123,
    id_aluno_avaliador: 456, // for student evaluations
    id_professor: 789,       // for professor evaluations
    id_aluno_avaliado: 101,
    notas: JSON.stringify(notas)
});
```

### 3. Page Refresh Events
Components can listen for automatic refresh events:

```typescript
import { pageRefreshEvents } from "$lib/utils/stores";

pageRefreshEvents.subscribe((event) => {
    if (event?.type === 'turmas') {
        // Turmas data was modified, refresh if needed
        fetchTurmas(true);
    }
});
```

### 4. Manual Cache Control
When needed, you can still manually trigger cache invalidation:

```typescript
import { autoInvalidate, triggerPageRefresh } from "$lib/utils/stores";

// Manual invalidation
await autoInvalidate.turmaUpdated("123");
await autoInvalidate.problemaDeleted("456", "123");

// Manual page refresh events
triggerPageRefresh.turmas();
triggerPageRefresh.problemas();
```

## Cache Relationship Map

### Turma Operations
- **Create Turma** → Invalidates: `turmasCache`
- **Update Turma** → Invalidates: `turmaCache`, `turmasCache`, `problemasCache` for that turma
- **Delete Turma** → Invalidates: `turmaCache`, `turmasCache`, `problemasCache`, `alunosCache`
- **Add/Remove Aluno** → Invalidates: `turmaCache`, `turmasCache`

### Problema Operations
- **Create Problema** → Invalidates: `problemasCache` for the turma
- **Update Problema** → Invalidates: `problemaCache`, `problemasCache`, `avaliacoesCache` for that problema
- **Delete Problema** → Invalidates: `problemaCache`, `problemasCache`, `avaliacoesCache`

### Aluno Operations
- **Create/Update Aluno** → Invalidates: `alunoCache`, `alunosCache`, related `turmaCache`
- **Delete Aluno** → Invalidates: `alunoCache`, `alunosCache`, related `turmaCache`

### Avaliacao Operations
- **Create/Update/Delete Avaliacao** → Invalidates: `avaliacoesCache` for the problema

### Professor Operations
- **Update Professor** → Invalidates: `professorCache`, `turmasCache` (as professor teaches turmas)

## Migration Guide

### Before (Manual Cache Invalidation)
```typescript
// Old way - manual cache invalidation
const response = await api.post("/turmas/create", turmaData);
TurmasService.invalidateCache(); // Manual step
await fetchTurmas(); // Manual refresh
```

### After (Automatic Cache Invalidation)
```typescript
// New way - automatic cache invalidation
const newTurma = await TurmasService.create(turmaData);
// Cache is automatically invalidated and page refresh events are triggered
```

## Page Integration

### Listening for Changes
```typescript
import { pageRefreshEvents, afterNavigate } from "$lib/utils/stores";

// Listen for data changes
pageRefreshEvents.subscribe((event) => {
    if (event?.type === 'turmas' && $currentUser !== undefined) {
        fetchTurmas(true); // Force refresh
    }
});

// Refresh on navigation
afterNavigate(({ type }) => {
    if (type === "enter" && $currentUser !== undefined) {
        fetchTurmas(true);
    }
});
```

### Page Visibility Handling
```typescript
// Refresh when returning to tab
document.addEventListener("visibilitychange", () => {
    if (!document.hidden && pageWasHidden) {
        fetchTurmas(true);
    }
});
```

## Best Practices

1. **Use Services**: Always use the service methods instead of raw API calls
2. **Trust Auto-Invalidation**: Don't manually invalidate caches unless absolutely necessary
3. **Listen for Events**: Subscribe to `pageRefreshEvents` for reactive updates
4. **Force Refresh**: Use `forceRefresh=true` when you need immediate fresh data

## Benefits

1. **Consistency**: Data is always up-to-date across all components
2. **Performance**: Efficient caching with smart invalidation
3. **Maintainability**: Centralized cache management
4. **Reliability**: Automatic handling reduces bugs from missed invalidations
5. **Developer Experience**: Simple service calls handle all complexity

## Legacy Compatibility

The old cache invalidation methods are still available for backward compatibility:
- `cacheInvalidation.invalidateTurma()`
- `cacheInvalidation.invalidateProblema()`
- `cacheInvalidation.invalidateAvaliacoes()`

However, it's recommended to migrate to the new service-based approach. 