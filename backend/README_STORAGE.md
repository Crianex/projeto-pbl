# Configuração do Storage do Supabase para Avatares

Este documento explica como configurar o storage do Supabase para armazenar avatares de usuários.

## Pré-requisitos

1. Projeto Supabase configurado
2. Variáveis de ambiente configuradas no arquivo `.env`:
   ```
   SUPABASE_URL=sua_url_do_supabase
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
   ```

## Configuração Automática

Execute o script de configuração:

```bash
cd backend
npm run setup-storage
```

Este script irá:
- Criar o bucket `avatars` se não existir
- Configurar políticas de acesso
- Definir tipos de arquivo permitidos (JPEG, PNG, GIF, WebP)
- Definir limite de tamanho (5MB)

## Configuração Manual (Alternativa)

Se preferir configurar manualmente:

### 1. Criar Bucket no Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para Storage
3. Clique em "Create a new bucket"
4. Nome: `avatars`
5. Marque como "Public bucket"
6. Clique em "Create bucket"

### 2. Configurar Políticas de Acesso

No SQL Editor do Supabase, execute:

```sql
-- Permitir upload de avatares
CREATE POLICY "allow_avatar_upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- Permitir visualização de avatares
CREATE POLICY "allow_avatar_view" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Permitir atualização de avatares
CREATE POLICY "allow_avatar_update" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars');
```

## Estrutura de Arquivos

Os avatares serão organizados da seguinte forma:

```
avatars/
├── alunos/
│   ├── avatar_1_1234567890.jpg
│   └── avatar_2_1234567891.png
└── professores/
    ├── avatar_1_1234567892.jpg
    └── avatar_2_1234567893.png
```

## URLs dos Avatares

Os avatares geram URLs públicas com duração infinita no formato:
```
https://[project-ref].supabase.co/storage/v1/object/public/avatars/[caminho-do-arquivo]
```

## Endpoints da API

### Upload de Avatar de Aluno
```
POST /alunos/uploadAvatar?id_aluno=123
Content-Type: multipart/form-data
Body: avatar (file)
```

### Upload de Avatar de Professor
```
POST /professores/uploadAvatar?id_professor=456
Content-Type: multipart/form-data
Body: avatar (file)
```

## Resposta da API

```json
{
  "success": true,
  "avatar_url": "https://[project-ref].supabase.co/storage/v1/object/public/avatars/alunos/avatar_1_1234567890.jpg",
  "aluno": {
    "id_aluno": 1,
    "nome_completo": "João Silva",
    "email": "joao@email.com",
    "link_avatar": "https://[project-ref].supabase.co/storage/v1/object/public/avatars/alunos/avatar_1_1234567890.jpg"
  }
}
```

## Validações

- **Tipo de arquivo**: Apenas imagens (JPEG, PNG, GIF, WebP)
- **Tamanho máximo**: 5MB
- **Nome único**: Gera automaticamente com timestamp

## Segurança

- URLs públicas com duração infinita
- Validação de tipo e tamanho de arquivo
- Organização por tipo de usuário (alunos/professores)
- Políticas de acesso configuradas no Supabase 