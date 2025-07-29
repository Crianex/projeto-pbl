import { EndpointController, RequestType, Problema } from '../config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../config/utils';
import { supabase } from '../config/supabase_wrapper';
import { createControllerLogger } from '../utils/controller_logger';
import { MediaCalculator } from '../utils/utils';

const logger = createControllerLogger('Problema', 'Controller');

export const ProblemaController: EndpointController = {
    name: 'problemas',
    routes: {
        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            logger.info(`Fetching all problemas`);

            const { data, error } = await supabase
                .from('problemas')
                .select(`
                    *,
                    turma:turmas(*)
                `);

            if (error) {
                logger.error(`Error fetching problemas: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            logger.info(`Successfully fetched ${data?.length || 0} problemas`);
            return res.json(data);
        }),

        'list-by-turma': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { id_turma, id_aluno } = req.query;
            if (!id_turma) {
                logger.error('No id_turma provided');
                return res.status(400).json({ error: 'No id_turma provided' });
            }
            logger.info(`Fetching problemas for turma ${id_turma}${id_aluno ? ` with student-specific averages for aluno ${id_aluno}` : ''}`);

            const { data, error } = await supabase
                .from('problemas')
                .select(`
                    *,
                    turma:turmas(*)
                `)
                .eq('id_turma', id_turma);

            if (error) {
                logger.error(`Error fetching problemas for turma ${id_turma}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            // If id_aluno is provided, calculate student-specific averages
            if (id_aluno && data) {
                logger.info(`Calculating student-specific averages for aluno ${id_aluno}`);

                for (const problema of data) {
                    // Get all evaluations for this problem where the specified student was evaluated
                    const { data: avaliacoes, error: avaliacoesError } = await supabase
                        .from('avaliacoes')
                        .select('notas')
                        .eq('id_problema', problema.id_problema)
                        .eq('id_aluno_avaliado', id_aluno);

                    if (!avaliacoesError && avaliacoes && avaliacoes.length > 0) {
                        // Calculate average of all grades this student received for this problem
                        const notas = avaliacoes.map(a => MediaCalculator.calculateSimpleMedia(a.notas));
                        const studentAverage = notas.reduce((a, b) => a + b, 0) / notas.length;

                        // Replace the general average with the student's specific average
                        problema.media_geral = Number(studentAverage.toFixed(2));

                        logger.info(`Student ${id_aluno} average for problema ${problema.id_problema}: ${problema.media_geral} (from ${avaliacoes.length} evaluations)`);
                    } else {
                        // No evaluations found for this student on this problem
                        problema.media_geral = null;
                        logger.info(`No evaluations found for student ${id_aluno} on problema ${problema.id_problema}`);
                    }
                }
            }

            logger.info(`Successfully fetched ${data?.length || 0} problemas for turma ${id_turma}`);
            return res.json(data);
        }),

        'get': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { id_problema } = req.query;
            if (!id_problema) {
                logger.error('No id_problema provided');
                return res.status(400).json({ error: 'No id_problema provided' });
            }
            logger.info(`Fetching problema with id_problema: ${id_problema}`);

            const { data, error } = await supabase
                .from('problemas')
                .select(`
                    *,
                    turma:turmas(*,alunos:alunos(*)),
                    avaliacoes:avaliacoes(*)
                `)
                .eq('id_problema', id_problema)
                .single();

            if (error) {
                logger.error(`Error fetching problema ${id_problema}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
                logger.warn(`Problema with id_problema ${id_problema} not found`);
                return res.status(404).json({ error: 'Problema not found' });
            }

            logger.info(`Successfully fetched problema ${id_problema}`);
            return res.json(data);
        }),

        'create': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const requiredFields = ['nome_problema', 'id_turma', 'criterios', 'definicao_arquivos_de_avaliacao', 'data_e_hora_criterios_e_arquivos'];
            const missingFields = requiredFields.filter(field => !req.body[field]);
            if (missingFields.length > 0) {
                logger.error(`Missing required fields: ${missingFields.join(', ')}`);
                return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
            }
            const { nome_problema, id_turma, criterios, definicao_arquivos_de_avaliacao, data_e_hora_criterios_e_arquivos } = req.body;
            logger.info(`Creating new problema: ${nome_problema} for turma ${id_turma}`);

            const { data, error } = await supabase
                .from('problemas')
                .insert([{
                    nome_problema,
                    id_turma,
                    criterios: criterios || '{}',
                    media_geral: 0,
                    definicao_arquivos_de_avaliacao: definicao_arquivos_de_avaliacao || '[]',
                    data_e_hora_criterios_e_arquivos: data_e_hora_criterios_e_arquivos || '{}'
                }])
                .select(`
                    *,
                    turma:turmas(*)
                `)
                .single();

            if (error) {
                logger.error(`Error creating problema: ${error.message}, Request body: ${JSON.stringify(req.body)}`);
                return res.status(500).json({ error: error.message });
            }

            logger.info(`Successfully created problema with id_problema: ${data?.id_problema}`);
            return res.status(201).json(data);
        }),

        'update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
            const { id_problema } = req.query;
            if (!id_problema) {
                logger.error('No id_problema provided');
                return res.status(400).json({ error: 'No id_problema provided' });
            }
            const { nome_problema, id_turma, criterios, media_geral, definicao_arquivos_de_avaliacao, data_e_hora_criterios_e_arquivos, faltas_por_tag } = req.body;
            logger.info(`Updating problema ${id_problema} with new data: ${JSON.stringify(req.body)}`);

            const { data, error } = await supabase
                .from('problemas')
                .update({
                    nome_problema,
                    id_turma,
                    criterios,
                    media_geral,
                    definicao_arquivos_de_avaliacao,
                    data_e_hora_criterios_e_arquivos,
                    faltas_por_tag
                })
                .eq('id_problema', id_problema)
                .select(`
                    *,
                    turma:turmas(*)
                `)
                .single();

            if (error) {
                logger.error(`Error updating problema ${id_problema}: ${error.message}, Request body: ${JSON.stringify(req.body)}`);
                return res.status(500).json({ error: error.message });
            }

            if (!data) {
                logger.warn(`Attempted to update non-existent problema ${id_problema}`);
                return res.status(404).json({ error: 'Problema not found' });
            }

            logger.info(`Successfully updated problema ${id_problema}`);
            return res.json(data);
        }),

        'delete': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            const { id_problema } = req.query;
            if (!id_problema) {
                logger.error('No id_problema provided');
                return res.status(400).json({ error: 'No id_problema provided' });
            }
            logger.info(`Attempting to delete problema ${id_problema}`);

            const { error } = await supabase
                .from('problemas')
                .delete()
                .eq('id_problema', id_problema);

            if (error) {
                logger.error(`Error deleting problema ${id_problema}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            logger.info(`Successfully deleted problema ${id_problema}`);
            return res.status(204).send();
        }),

        'add-avaliacao': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const { id_problema, id_aluno_avaliador, id_aluno_avaliado, notas } = req.body;
            if (!id_problema || !id_aluno_avaliador || !id_aluno_avaliado || !notas) {
                logger.error('Missing required fields');
                return res.status(400).json({ error: 'Missing required fields' });
            }
            logger.info(`Adding avaliacao for problema ${id_problema}: avaliador ${id_aluno_avaliador} -> avaliado ${id_aluno_avaliado}`);

            const { data, error } = await supabase
                .from('avaliacoes')
                .insert([{
                    id_problema,
                    id_aluno_avaliador,
                    id_aluno_avaliado,
                    notas: notas || '{}'
                }])
                .select(`
                    *,
                    avaliador:alunos!avaliacoes_id_aluno_avaliador_fkey(*),
                    avaliado:alunos!avaliacoes_id_aluno_avaliado_fkey(*)
                `)
                .single();

            if (error) {
                logger.error(`Error adding avaliacao to problema ${id_problema}: ${error.message}, Request body: ${JSON.stringify(req.body)}`);
                return res.status(500).json({ error: error.message });
            }

            logger.info(`Successfully added avaliacao for problema ${id_problema}. Updating media_geral...`);

            // Update media_geral
            const { data: avaliacoes, error: avaliacoesError } = await supabase
                .from('avaliacoes')
                .select('notas')
                .eq('id_problema', id_problema);

            if (avaliacoesError) {
                logger.error(`Error fetching avaliacoes for media calculation: ${avaliacoesError.message}`);
            }

            if (!avaliacoesError && avaliacoes) {
                const notas = avaliacoes.map(a => MediaCalculator.calculateSimpleMedia(a.notas));
                const media = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;

                logger.info(`Calculated new media_geral for problema ${id_problema}: ${media}`);

                const { error: updateError } = await supabase
                    .from('problemas')
                    .update({ media_geral: media })
                    .eq('id_problema', id_problema);

                if (updateError) {
                    logger.error(`Error updating media_geral: ${updateError.message}`);
                } else {
                    logger.info(`Successfully updated media_geral for problema ${id_problema}`);
                }
            }

            return res.status(201).json(data);
        }),

        'get-avaliacoes': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { id_problema } = req.query;
            if (!id_problema) {
                logger.error('No id_problema provided');
                return res.status(400).json({ error: 'No id_problema provided' });
            }
            logger.info(`Fetching avaliacoes for problema ${id_problema}`);

            const { data, error } = await supabase
                .from('avaliacoes')
                .select(`
                    *,
                    avaliador:alunos!avaliacoes_id_aluno_avaliador_fkey(*),
                    avaliado:alunos!avaliacoes_id_aluno_avaliado_fkey(*)
                `)
                .eq('id_problema', id_problema);

            if (error) {
                logger.error(`Error fetching avaliacoes for problema ${id_problema}: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }

            logger.info(`Successfully fetched ${data?.length || 0} avaliacoes for problema ${id_problema}`);
            return res.json(data);
        }),

        'upload-arquivo': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            const { id_aluno, id_problema, nome_tipo } = req.body;
            logger.info(`Uploading arquivo for aluno ${id_aluno}, problema ${id_problema}, tipo ${nome_tipo}`);
            if (!id_aluno || !id_problema || !nome_tipo) {
                logger.error('id_aluno, id_problema and nome_tipo are required');
                return res.status(400).json({ error: 'id_aluno, id_problema and nome_tipo are required' });
            }

            if (!req.files || !req.files.arquivo) {
                return res.status(400).json({ error: 'Arquivo file is required' });
            }

            const arquivoFile = req.files.arquivo as any;

            // Validate file size - max 10MB
            if (arquivoFile.size > 10 * 1024 * 1024) {
                logger.error(`File size too large: ${arquivoFile.size} bytes (max: 10MB)`);
                return res.status(400).json({ error: 'File size must be less than 10MB' });
            }

            try {
                // Check if file already exists for this aluno/problema/tipo combination
                const { data: existingFiles, error: existingError } = await supabase
                    .from('arquivos_alunos_problema')
                    .select('*')
                    .eq('id_aluno', id_aluno)
                    .eq('id_problema', id_problema)
                    .eq('nome_tipo', nome_tipo);

                if (existingError) {
                    logger.error(`Error checking existing files: ${existingError.message}`);
                    return res.status(500).json({ error: 'Error checking existing files' });
                }

                // If file exists, delete it from storage and database
                if (existingFiles && existingFiles.length > 0) {
                    logger.info(`Found ${existingFiles.length} existing file(s) for aluno ${id_aluno}, problema ${id_problema}, tipo ${nome_tipo}. Replacing...`);

                    for (const existingFile of existingFiles) {
                        // Extract filename from signed URL or use a pattern to find the file
                        const urlParts = existingFile.link_arquivo?.split('/');
                        const filenamePart = urlParts?.[urlParts.length - 1]?.split('?')[0];

                        if (filenamePart) {
                            // Try to delete from storage (don't fail if file doesn't exist)
                            const { error: deleteStorageError } = await supabase.storage
                                .from('arquivos')
                                .remove([`aluno_problema/${filenamePart}`]);

                            if (deleteStorageError) {
                                logger.warn(`Could not delete file from storage: ${deleteStorageError.message}`);
                            } else {
                                logger.info(`Deleted existing file from storage: ${filenamePart}`);
                            }
                        }

                        // Delete from database
                        const { error: deleteDbError } = await supabase
                            .from('arquivos_alunos_problema')
                            .delete()
                            .eq('id_arquivo', existingFile.id_arquivo);

                        if (deleteDbError) {
                            logger.error(`Error deleting existing file from database: ${deleteDbError.message}`);
                        } else {
                            logger.info(`Deleted existing file record from database: ${existingFile.id_arquivo}`);
                        }
                    }
                }

                // Generate unique filename
                const fileExtension = arquivoFile.name.split('.').pop();
                const fileName = `aluno_problema/arquivo_${id_aluno}_${id_problema}_${nome_tipo}_${Date.now()}.${fileExtension}`;

                // Upload to Supabase Storage (bucket: arquivos)
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('arquivos')
                    .upload(fileName, arquivoFile.data, {
                        contentType: arquivoFile.mimetype,
                        upsert: true
                    });

                if (uploadError) {
                    logger.error(`Error uploading to Supabase storage: ${uploadError.message}`);
                    return res.status(500).json({ error: 'Error uploading file to storage' });
                }

                // Generate private URL with infinite expiration
                const { data: urlData, error: urlError } = await supabase.storage
                    .from('arquivos')
                    .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 100); // 100 years

                if (urlError || !urlData) {
                    logger.error(`Error generating signed URL: ${urlError?.message}`);
                    return res.status(500).json({ error: 'Error generating file URL' });
                }

                // Save file metadata in arquivos_aluno_problema table
                const { data, error: dbError } = await supabase
                    .from('arquivos_alunos_problema')
                    .insert([{
                        id_aluno,
                        id_problema,
                        nome_arquivo: arquivoFile.name,
                        link_arquivo: urlData.signedUrl,
                        nome_tipo
                    }])
                    .select()
                    .single();

                if (dbError) {
                    logger.error(`Error saving file metadata: ${dbError.message}`);
                    return res.status(500).json({ error: dbError.message });
                }

                logger.info(`Successfully uploaded arquivo for aluno ${id_aluno}, problema ${id_problema}, tipo ${nome_tipo}`);
                return res.status(201).json({
                    success: true,
                    arquivo: data
                });
            } catch (error) {
                logger.error(`Error uploading arquivo for aluno ${id_aluno}, problema ${id_problema}, tipo ${nome_tipo}: ${error}`);
                return res.status(500).json({ error: 'Error uploading arquivo' });
            }
        }),

        'get-arquivos': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            const { id_aluno, id_problema, nome_tipo } = req.query;
            if (!id_aluno && !id_problema) {
                return res.status(400).json({ error: 'id_aluno or id_problema is required' });
            }

            let query = supabase.from('arquivos_alunos_problema').select('*');
            if (id_aluno) {
                query = query.eq('id_aluno', id_aluno);
            }
            if (id_problema) {
                query = query.eq('id_problema', id_problema);
            }
            if (nome_tipo) {
                query = query.eq('nome_tipo', nome_tipo);
            }

            const { data, error } = await query;
            if (error) {
                logger.error(`Error fetching arquivos: ${error.message}`);
                return res.status(500).json({ error: error.message });
            }
            return res.json(data);
        })
    }

}; 