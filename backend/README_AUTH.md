# Authentication System

This document describes the authentication system implemented in the backend and frontend.

## Overview

The system now uses Supabase authentication tokens to validate user requests. The backend validates that users are logged in and checks their email against the `alunos` and `professores` tables to determine their role and permissions. The frontend automatically includes the Supabase access token in all API requests.

## Backend Authentication Functions

### Centralized Validation Functions

Located in `src/config/utils.ts`:

- `validateAuthToken(req)`: Validates the Supabase auth token and returns user data
- `validateAluno(req)`: Validates that the user is an aluno and returns aluno data
- `validateProfessor(req)`: Validates that the user is a professor and returns professor data
- `validateUser(req)`: Validates that the user is either an aluno or professor

### Middleware Functions

- `requireAlunoAuth(req, res, next)`: Middleware that requires aluno authentication
- `requireProfessorAuth(req, res, next)`: Middleware that requires professor authentication
- `requireAuth(req, res, next)`: Middleware that requires any user authentication

## Frontend Authentication

### API Utility (`frontend/src/lib/utils/api.ts`)

The frontend API utility automatically includes the Supabase access token in all requests:

- **`getAuthToken()`**: Gets the current Supabase access token
- **`prepareHeaders()`**: Prepares headers with authentication token
- **Automatic Token Inclusion**: All API requests automatically include the `Authorization: Bearer <token>` header

### Authentication Flow (`frontend/src/lib/utils/auth.ts`)

The authentication system handles:

1. **Session Management**: Automatically manages Supabase sessions
2. **User Creation**: Creates new users during the initial authentication flow
3. **Role Detection**: Determines if a user is an aluno or professor
4. **Route Protection**: Protects routes based on user roles

## Usage in Controllers

### AlunoController
- **Most endpoints**: Require authentication (`Utils.validateUser(req)`)
- **User creation/lookup**: Allow unauthenticated access for auth flow
  - `create`: Allows unauthenticated access for user creation
  - `getByEmail`: Allows unauthenticated access for user lookup

### ProfessorController
- **Most endpoints**: Require professor authentication (`Utils.validateProfessor(req)`)
- **User creation/lookup**: Allow unauthenticated access for auth flow
  - `create`: Allows unauthenticated access for professor creation
  - `getByEmail`: Allows unauthenticated access for user lookup

### TurmaController
- **Read operations**: Allow both alunos and professores (`Utils.validateUser(req)`)
  - `list`: Alunos can see their own turmas, professores can see all turmas
  - `get`: Alunos can access their own turma, professores can access any turma
- **Write operations**: Require professor authentication (`Utils.validateProfessor(req)`)
  - `create`, `update`, `delete`, `add-aluno`, `remove-aluno`
- Turmas are managed by professors, but alunos can view their own turma data

### ProblemaController
- **Read operations**: Allow both alunos and professores (`Utils.validateUser(req)`)
  - `list`, `get`, `get-avaliacoes`, `get-arquivos`
- **Write operations**: Require professor authentication (`Utils.validateProfessor(req)`)
  - `create`, `update`, `delete`
- **File operations**: Allow both alunos and professores (`Utils.validateUser(req)`)
  - `upload-arquivo`

### AvaliacaoController
- **All endpoints**: Require authentication (`Utils.validateUser(req)`)
- Avaliações can be created by both alunos and professores

## Request Headers

The system expects the following headers:

```
Authorization: Bearer <supabase_access_token>
```

The token should be a valid Supabase access token obtained from the frontend authentication.

## Error Responses

When authentication fails, the system returns:

```json
{
  "error": "Unauthorized: Valid authentication required"
}
```

Or for professor-specific endpoints:

```json
{
  "error": "Unauthorized: Valid professor authentication required"
}
```

## Implementation Details

### Backend
1. **Token Validation**: The system validates the Supabase auth token using `supabase.auth.getUser()`
2. **Email Lookup**: After token validation, it looks up the user's email in the `alunos` and `professores` tables
3. **Role Determination**: Based on which table contains the email, the user is classified as either 'aluno' or 'professor'
4. **Request Enhancement**: The validated user data is attached to the request object as `req.user`

### Frontend
1. **Automatic Token Inclusion**: All API requests automatically include the Supabase access token
2. **Session Management**: The auth system manages Supabase sessions and user state
3. **User Creation**: Handles the creation of new users during the authentication flow
4. **Error Handling**: Proper error handling for authentication failures

## Security Considerations

- All endpoints now require valid authentication (except specific auth flow endpoints)
- Professor-specific operations are properly protected
- Token validation happens on every request
- Email verification ensures users exist in the database
- Proper error messages are returned for unauthorized access
- Frontend automatically includes authentication tokens

## Special Auth Flow Endpoints

The following endpoints allow unauthenticated access specifically for the authentication flow:

- `POST /alunos/create` - User creation during auth flow
- `GET /alunos/getByEmail` - User lookup during auth flow
- `POST /professores/create` - Professor creation during auth flow
- `GET /professores/getByEmail` - Professor lookup during auth flow

These endpoints are necessary because users don't exist in the database yet when they first sign up through Supabase.

## Testing

To test the authentication system:

1. Ensure you have a valid Supabase access token
2. The frontend automatically includes the token in all requests
3. Make requests to any endpoint
4. Verify that unauthorized requests return 401 status codes
5. Verify that professor-only endpoints reject aluno users
6. Test the authentication flow for new user creation

## Future Enhancements

- Add role-based access control (RBAC) for more granular permissions
- Implement session management with refresh tokens
- Add rate limiting for authentication attempts
- Consider implementing JWT token refresh logic
- Add audit logging for authentication events 