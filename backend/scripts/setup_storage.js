const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStorage() {
    console.log('🔧 Configurando storage do Supabase...');

    try {
        // Criar bucket 'avatars' se não existir
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
            console.error('Erro ao listar buckets:', listError);
            return;
        }

        const avatarsBucket = buckets.find(bucket => bucket.name === 'avatars');
        
        if (!avatarsBucket) {
            console.log('📦 Criando bucket "avatars"...');
            const { data: bucket, error: createError } = await supabase.storage.createBucket('avatars', {
                public: true, // URLs públicas para avatares
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                fileSizeLimit: 5242880 // 5MB
            });

            if (createError) {
                console.error('Erro ao criar bucket:', createError);
                return;
            }

            console.log('✅ Bucket "avatars" criado com sucesso!');
        } else {
            console.log('✅ Bucket "avatars" já existe!');
        }

        // Configurar políticas de acesso (opcional - para mais segurança)
        console.log('🔐 Configurando políticas de acesso...');
        
        // Política para permitir upload de avatares
        const { error: uploadPolicyError } = await supabase.storage
            .from('avatars')
            .createPolicy('allow_avatar_upload', {
                name: 'allow_avatar_upload',
                definition: {
                    INSERT: {
                        check: 'bucket_id = \'avatars\''
                    }
                }
            });

        if (uploadPolicyError && uploadPolicyError.code !== '23505') { // 23505 = duplicate key
            console.error('Erro ao criar política de upload:', uploadPolicyError);
        } else {
            console.log('✅ Política de upload configurada!');
        }

        console.log('🎉 Configuração do storage concluída!');
        console.log('📋 Resumo:');
        console.log('   - Bucket: avatars');
        console.log('   - Público: Sim');
        console.log('   - Tipos permitidos: JPEG, PNG, GIF, WebP');
        console.log('   - Tamanho máximo: 5MB');

    } catch (error) {
        console.error('❌ Erro durante a configuração:', error);
    }
}

setupStorage(); 