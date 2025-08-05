# TypeScript Interfaces Guide

This guide explains the TypeScript interfaces used in the backend, including data structures, type definitions, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Core Interfaces](#core-interfaces)
3. [Database Interfaces](#database-interfaces)
4. [Request/Response Interfaces](#requestresponse-interfaces)
5. [Utility Interfaces](#utility-interfaces)
6. [Type Safety](#type-safety)
7. [Best Practices](#best-practices)

## Overview

The backend uses TypeScript interfaces to ensure type safety and provide clear contracts for data structures. All interfaces are defined in `src/config/interfaces.ts` and used throughout the application.

### Key Benefits

- **Type Safety**: Catch errors at compile time
- **Documentation**: Self-documenting code
- **IDE Support**: Better autocomplete and refactoring
- **Consistency**: Standardized data structures
- **Maintainability**: Easier to understand and modify

## Core Interfaces

### RequestType Enum

```typescript
export enum RequestType {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
}
```

**Usage:**
```typescript
import { RequestType } from '../config/interfaces';

'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
    // Implementation
}),
```

### AuthUser Interface

```typescript
export interface AuthUser {
    id: number;
    email: string;
    nome_completo: string;
    type: 'aluno' | 'professor' | 'coordenador';
}
```

**Properties:**
- `id`: Unique user identifier
- `email`: User's email address
- `nome_completo`: Full name of the user
- `type`: User type (aluno, professor, or coordenador)

**Usage:**
```typescript
const authUser: AuthUser = {
    id: 123,
    email: 'user@example.com',
    nome_completo: 'John Doe',
    type: 'professor'
};
```

### EndpointController Interface

```typescript
export interface EndpointController {
    name: string;
    routes: {
        [key: string]: Pair<RequestType, (req: Request, res: Response) => Promise<Response | void>>
    };
}
```

**Properties:**
- `name`: Controller name for identification
- `routes`: Object containing route definitions with HTTP methods and handlers

**Usage:**
```typescript
export const AvaliacaoController: EndpointController = {
    name: 'avaliacoes',
    routes: {
        'list': new Pair(RequestType.GET, async (req, res) => {
            // Implementation
        }),
        'create': new Pair(RequestType.POST, async (req, res) => {
            // Implementation
        }),
    }
};
```

## Database Interfaces

### Aluno Interface

```typescript
export interface Aluno {
    id_aluno: number;
    created_at: Date;
    nome_completo: string | null;
    email: string | null;
    id_turma: number | null;
    link_avatar: string | null;
}
```

**Properties:**
- `id_aluno`: Primary key for student
- `created_at`: Record creation timestamp
- `nome_completo`: Student's full name
- `email`: Student's email address
- `id_turma`: Foreign key to class
- `link_avatar`: URL to student's avatar image

### Professor Interface

```typescript
export interface Professor {
    id_professor: number;
    created_at: Date;
    nome_completo: string | null;
    email: string | null;
    link_avatar: string | null;
    id_turma: number | null;
}
```

**Properties:**
- `id_professor`: Primary key for professor
- `created_at`: Record creation timestamp
- `nome_completo`: Professor's full name
- `email`: Professor's email address
- `link_avatar`: URL to professor's avatar image
- `id_turma`: Foreign key to class (if assigned)

### Turma Interface

```typescript
export interface Turma {
    id_turma: number;
    created_at: Date;
    id_professor: number | null;
    nome_turma: string | null;
    professor: Professor | null;
    alunos: Aluno[] | null;
}
```

**Properties:**
- `id_turma`: Primary key for class
- `created_at`: Record creation timestamp
- `id_professor`: Foreign key to professor
- `nome_turma`: Class name
- `professor`: Related professor object
- `alunos`: Array of related student objects

### Problema Interface

```typescript
export interface Problema {
    id_problema: number;
    created_at: Date;
    data_inicio: Date | null;
    data_fim: Date | null;
    nome_problema: string | null;
    id_turma: number | null;
    media_geral: number | null;
    criterios: string;
    definicao_arquivos_de_avaliacao: string;
    data_e_hora_criterios_e_arquivos: string;
    faltas_por_tag: string;
}
```

**Properties:**
- `id_problema`: Primary key for problem
- `created_at`: Record creation timestamp
- `data_inicio`: Problem start date
- `data_fim`: Problem end date
- `nome_problema`: Problem name
- `id_turma`: Foreign key to class
- `media_geral`: Average grade for the problem
- `criterios`: JSON string of evaluation criteria
- `definicao_arquivos_de_avaliacao`: JSON string of file definitions
- `data_e_hora_criterios_e_arquivos`: Timestamp of criteria and files definition
- `faltas_por_tag`: JSON string of absences by tag

### Avaliacao Interface

```typescript
export interface Avaliacao {
    id_avaliacao: number;
    created_at: Date;
    id_problema: number | null;
    id_aluno_avaliador: number | null;
    id_aluno_avaliado: number | null;
    notas: string;
    notas_por_arquivo: string;
}
```

**Properties:**
- `id_avaliacao`: Primary key for evaluation
- `created_at`: Record creation timestamp
- `id_problema`: Foreign key to problem
- `id_aluno_avaliador`: Foreign key to evaluating student
- `id_aluno_avaliado`: Foreign key to evaluated student
- `notas`: JSON string of grades
- `notas_por_arquivo`: JSON string of grades by file

### Coordenador Interface

```typescript
export interface Coordenador {
    id_coordenador: number;
    created_at: Date;
    email: string;
}
```

**Properties:**
- `id_coordenador`: Primary key for coordinator
- `created_at`: Record creation timestamp
- `email`: Coordinator's email address

### File Interfaces

#### ArquivoAlunoTurma Interface

```typescript
export interface ArquivoAlunoTurma {
    id_arquivo: number;
    created_at: Date;
    id_aluno: number | null;
    id_turma: number | null;
    nome_arquivo: string | null;
    link_arquivo: string | null;
}
```

#### ArquivoAlunoProblema Interface

```typescript
export interface ArquivoAlunoProblema {
    id_arquivo: number;
    created_at: Date;
    id_aluno: number | null;
    id_problema: number | null;
    nome_arquivo: string | null;
    link_arquivo: string | null;
    nome_tipo: string | null;
}
```

## Request/Response Interfaces

### Express Request Extension

```typescript
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
```

This extends the Express Request interface to include the authenticated user.

**Usage:**
```typescript
app.get('/protected', (req: Request, res: Response) => {
    const user = req.user; // TypeScript knows this is AuthUser | undefined
    if (user) {
        console.log(`User ${user.id} accessed the endpoint`);
    }
});
```

## Utility Interfaces

### Pair Utility

```typescript
export class Pair<K, V> {
    key: K;
    value: V;

    constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
    }
}
```

**Usage:**
```typescript
import { Pair } from '../config/utils';

const route = new Pair(RequestType.GET, async (req: Request, res: Response) => {
    // Route handler implementation
});
```

## Type Safety

### Type Guards

```typescript
// Check if user is a professor
function isProfessor(user: AuthUser): user is AuthUser & { type: 'professor' } {
    return user.type === 'professor';
}

// Check if user is a student
function isAluno(user: AuthUser): user is AuthUser & { type: 'aluno' } {
    return user.type === 'aluno';
}

// Usage
const authUser: AuthUser = await Utils.validateUser(req);
if (isProfessor(authUser)) {
    // TypeScript knows authUser.type is 'professor'
    console.log(`Professor ${authUser.nome_completo} accessed the endpoint`);
}
```

### Nullable Types

```typescript
// Handle nullable fields
const aluno: Aluno = {
    id_aluno: 1,
    created_at: new Date(),
    nome_completo: 'John Doe',
    email: 'john@example.com',
    id_turma: null, // Can be null
    link_avatar: null // Can be null
};

// Safe access to nullable fields
const turmaId = aluno.id_turma ?? 'No class assigned';
const avatar = aluno.link_avatar || '/default-avatar.png';
```

### Union Types

```typescript
// User type can be one of three values
type UserType = 'aluno' | 'professor' | 'coordenador';

// Function that handles different user types
function handleUserType(type: UserType): string {
    switch (type) {
        case 'aluno':
            return 'Student access';
        case 'professor':
            return 'Professor access';
        case 'coordenador':
            return 'Coordinator access';
        default:
            return 'Unknown access';
    }
}
```

## Best Practices

### 1. Use Strict Typing

```typescript
// Good: Explicit typing
const alunos: Aluno[] = data.map(item => ({
    id_aluno: item.id_aluno,
    nome_completo: item.nome_completo,
    email: item.email,
    // ... other fields
}));

// Avoid: Implicit any
const alunos = data.map(item => ({
    id_aluno: item.id_aluno,
    nome_completo: item.nome_completo,
    // ... other fields
}));
```

### 2. Handle Optional Fields

```typescript
// Good: Handle optional fields safely
const nomeCompleto = aluno.nome_completo || 'Unknown';
const email = aluno.email ?? 'No email provided';

// Avoid: Direct access to optional fields
const nomeCompleto = aluno.nome_completo; // Could be null
```

### 3. Use Interface Composition

```typescript
// Base interface
interface BaseEntity {
    id: number;
    created_at: Date;
}

// Extend base interface
interface Aluno extends BaseEntity {
    nome_completo: string | null;
    email: string | null;
    id_turma: number | null;
    link_avatar: string | null;
}
```

### 4. Validate Data at Runtime

```typescript
// Validate data structure
function isValidAluno(data: any): data is Aluno {
    return (
        typeof data === 'object' &&
        typeof data.id_aluno === 'number' &&
        data.created_at instanceof Date &&
        (typeof data.nome_completo === 'string' || data.nome_completo === null)
    );
}

// Usage
const rawData = await fetchAlunoData();
if (isValidAluno(rawData)) {
    const aluno: Aluno = rawData;
    // Process aluno
} else {
    throw new Error('Invalid aluno data structure');
}
```

### 5. Use Generic Types

```typescript
// Generic function for parsing data
function parseData<T>(data: any[], parser: (item: any) => T): T[] {
    return data.map(parser);
}

// Usage
const alunos = parseData(rawData, (item) => ({
    id_aluno: item.id_aluno,
    nome_completo: item.nome_completo,
    email: item.email,
    // ... other fields
}));
```

### 6. Document Complex Interfaces

```typescript
/**
 * Represents a student evaluation with detailed grading information
 * 
 * @property id_avaliacao - Unique identifier for the evaluation
 * @property id_problema - Problem being evaluated
 * @property id_aluno_avaliador - Student performing the evaluation
 * @property id_aluno_avaliado - Student being evaluated
 * @property notas - JSON string containing detailed grades by criteria
 * @property notas_por_arquivo - JSON string containing grades organized by file
 */
export interface Avaliacao {
    id_avaliacao: number;
    created_at: Date;
    id_problema: number | null;
    id_aluno_avaliador: number | null;
    id_aluno_avaliado: number | null;
    notas: string; // JSON format: { "criterio1": 8, "criterio2": 9 }
    notas_por_arquivo: string; // JSON format: { "file1": { "criterio1": 8 } }
}
```

### 7. Use Const Assertions

```typescript
// Define constants with proper typing
const USER_TYPES = ['aluno', 'professor', 'coordenador'] as const;
type UserType = typeof USER_TYPES[number];

// This ensures type safety
function isValidUserType(type: string): type is UserType {
    return USER_TYPES.includes(type as UserType);
}
```

### 8. Handle Date Fields

```typescript
// Parse date fields safely
function parseDateField(dateString: string | null): Date | null {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
}

// Usage in parsers
function parseAluno(data: any): Aluno {
    return {
        id_aluno: data.id_aluno,
        created_at: parseDateField(data.created_at) || new Date(),
        nome_completo: data.nome_completo || null,
        email: data.email || null,
        id_turma: data.id_turma || null,
        link_avatar: data.link_avatar || null
    };
}
```

## Common Patterns

### Database Response Handling

```typescript
// Handle database responses with proper typing
async function fetchAlunos(): Promise<Aluno[]> {
    const { data, error } = await supabase
        .from('alunos')
        .select('*');

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
        return [];
    }

    // Parse and validate data
    return data.map(item => parseAluno(item));
}
```

### API Response Typing

```typescript
// Define response types
interface ApiResponse<T> {
    data: T;
    error: null;
}

interface ApiError {
    data: null;
    error: string;
}

type ApiResult<T> = ApiResponse<T> | ApiError;

// Usage
function createApiResponse<T>(data: T): ApiResponse<T> {
    return { data, error: null };
}

function createApiError(error: string): ApiError {
    return { data: null, error };
}
```

### Validation Functions

```typescript
// Validate required fields
function validateRequiredFields<T extends Record<string, any>>(
    data: T,
    requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
            missingFields.push(String(field));
        }
    }
    
    return {
        isValid: missingFields.length === 0,
        missingFields
    };
}

// Usage
const validation = validateRequiredFields(aluno, ['nome_completo', 'email']);
if (!validation.isValid) {
    throw new Error(`Missing required fields: ${validation.missingFields.join(', ')}`);
}
``` 