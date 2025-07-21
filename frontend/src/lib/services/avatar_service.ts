const API_BASE_URL = import.meta.env.DEV
    ? 'http://localhost:5919'
    : import.meta.env.VITE_API_URL;

export interface AvatarUploadResponse {
    success: boolean;
    avatar_url: string;
    aluno?: any;
    professor?: any;
}

export class AvatarService {
    static async uploadAlunoAvatar(idAluno: number, file: File): Promise<AvatarUploadResponse> {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch(`${API_BASE_URL}/alunos/uploadAvatar?id_aluno=${idAluno}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao fazer upload do avatar');
        }

        return await response.json();
    }

    static async uploadProfessorAvatar(idProfessor: number, file: File): Promise<AvatarUploadResponse> {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch(`${API_BASE_URL}/professores/uploadAvatar?id_professor=${idProfessor}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao fazer upload do avatar');
        }

        return await response.json();
    }

    static getAvatarUrl(avatarPath: string | null): string {
        if (!avatarPath) {
            return '/avatars/default.png';
        }
        
        // Se já é uma URL completa (Supabase), retorna como está
        if (avatarPath.startsWith('http')) {
            return avatarPath;
        }
        
        // Para caminhos relativos antigos (fallback)
        if (avatarPath.startsWith('/uploads/')) {
            return `${API_BASE_URL}${avatarPath}`;
        }
        
        return avatarPath;
    }
} 