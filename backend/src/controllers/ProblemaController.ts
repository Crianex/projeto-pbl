import { EndpointController, RequestType, Problema } from '../config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../config/utils';
import { supabase } from '../config/supabase_wrapper';
import { createControllerLogger } from '../utils/controller_logger';
import { MediaCalculator } from '../utils/media_utils';
import { Utils } from '../config/utils';

const logger = createControllerLogger('Problema', 'Controller');

export const ProblemaController: EndpointController = {
    name: 'problemas',
    routes: {
        'list': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            // Require authentication for listing problemas
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }

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
            // Require authentication for listing problemas by turma
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }

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
                    // Get all evaluations for this problem (including professor evaluations)
                    const { data: avaliacoes, error: avaliacoesError } = await supabase
                        .from('avaliacoes')
                        .select('*')
                        .eq('id_problema', problema.id_problema);

                    if (!avaliacoesError && avaliacoes && avaliacoes.length > 0) {
                        // Parse criterios and file definitions
                        let criteriosGroup = {};
                        let fileDefs = [];
                        try {
                            criteriosGroup = JSON.parse(problema.criterios);
                        } catch { }
                        try {
                            fileDefs = JSON.parse(problema.definicao_arquivos_de_avaliacao);
                        } catch { }

                        // Parse avaliacoes to get proper structure
                        const parsedAvaliacoes = avaliacoes.map((av) => {
                            let notas = av.notas;
                            let notas_por_arquivo = av.notas_por_arquivo;
                            try {
                                notas = typeof notas === 'string' ? JSON.parse(notas) : notas;
                            } catch { }
                            try {
                                notas_por_arquivo = typeof notas_por_arquivo === 'string' ? JSON.parse(notas_por_arquivo) : notas_por_arquivo;
                            } catch { }
                            return { ...av, notas, notas_por_arquivo };
                        });

                        // Use the MediaCalculator to get the final media for this specific student
                        const result = MediaCalculator.calculateFinalMedia(
                            parsedAvaliacoes,
                            Number(id_aluno),
                            criteriosGroup,
                            fileDefs
                        );

                        // Set the total final media (which includes professor, auto, and peer evaluations)
                        problema.media_geral = result.total;

                        logger.info(`Student ${id_aluno} final media for problema ${problema.id_problema}: ${problema.media_geral} (professor: ${result.professor}, auto: ${result.auto}, peers: ${result.peers})`);
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
            // Require authentication for getting problema details
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }

            const { id_problema, include_avaliacoes } = req.query as { id_problema?: string, include_avaliacoes?: string };
            if (!id_problema) {
                logger.error('No id_problema provided');
                return res.status(400).json({ error: 'No id_problema provided' });
            }
            // Default behavior: include avaliacoes (backwards-compatible)
            const shouldIncludeAvaliacoes = include_avaliacoes === undefined
                ? true
                : include_avaliacoes === 'true';

            logger.info(`Fetching problema with id_problema: ${id_problema}, include_avaliacoes=${shouldIncludeAvaliacoes}`);

            // Build select clause dynamically based on include_avaliacoes
            const selectClause = shouldIncludeAvaliacoes
                ? `*, turma:turmas(*,alunos:alunos(*)), avaliacoes:avaliacoes(*)`
                : `*, turma:turmas(*,alunos:alunos(*))`;

            const { data, error } = await supabase
                .from('problemas')
                .select(selectClause)
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
            // Require professor or coordenador authentication for creating problemas
            const authUser = await Utils.validateProfessorOrCoordenador(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid professor or coordenador authentication required' });
            }

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
            // Require professor or coordenador authentication for updating problemas
            const authUser = await Utils.validateProfessorOrCoordenador(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid professor or coordenador authentication required' });
            }

            const { id_problema } = req.query;
            if (!id_problema) {
                logger.error('No id_problema provided');
                return res.status(400).json({ error: 'No id_problema provided' });
            }
            const { nome_problema, id_turma, criterios, media_geral, definicao_arquivos_de_avaliacao, data_e_hora_criterios_e_arquivos, faltas_por_tag, notas_por_arquivo } = req.body;
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
                    faltas_por_tag,
                    notas_por_arquivo
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
            // Require professor or coordenador authentication for deleting problemas
            const authUser = await Utils.validateProfessorOrCoordenador(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid professor or coordenador authentication required' });
            }

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
            // Require authentication for adding avaliações
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }

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
            // 1. Fetch the full problem to get criterios and file definitions
            const { data: problema, error: problemaError } = await supabase
                .from('problemas')
                .select('*')
                .eq('id_problema', id_problema)
                .single();
            if (problemaError || !problema) {
                logger.error(`Error fetching full problema for media calculation: ${problemaError?.message}`);
            } else {
                // 2. Fetch all avaliacoes for the problem (with all relevant fields)
                const { data: avaliacoesFull, error: avaliacoesFullError } = await supabase
                    .from('avaliacoes')
                    .select('*')
                    .eq('id_problema', id_problema);
                if (avaliacoesFullError || !avaliacoesFull) {
                    logger.error(`Error fetching full avaliacoes for media calculation: ${avaliacoesFullError?.message}`);
                } else {
                    // 3. Parse criterios and file definitions
                    let criteriosGroup = {};
                    let fileDefs = [];
                    try {
                        criteriosGroup = JSON.parse(problema.criterios);
                    } catch { }
                    try {
                        fileDefs = JSON.parse(problema.definicao_arquivos_de_avaliacao);
                    } catch { }
                    // 4. Group avaliacoes by id_aluno_avaliado
                    const byAluno: Record<string, any[]> = {};
                    for (const av of avaliacoesFull) {
                        const alunoId = av.id_aluno_avaliado;
                        if (!byAluno[String(alunoId)]) byAluno[String(alunoId)] = [];
                        // Parse notas and notas_por_arquivo for calculation
                        let notas = av.notas;
                        let notas_por_arquivo = av.notas_por_arquivo;
                        try { notas = typeof notas === 'string' ? JSON.parse(notas) : notas; } catch { }
                        try { notas_por_arquivo = typeof notas_por_arquivo === 'string' ? JSON.parse(notas_por_arquivo) : notas_por_arquivo; } catch { }
                        byAluno[String(alunoId)].push({ ...av, notas, notas_por_arquivo });
                    }
                    // 5. For each student, calculate their final media
                    const allMedias = Object.entries(byAluno).map(([alunoId, avaliacoes]) => {
                        const avs = avaliacoes as any[];
                        const result = MediaCalculator.calculateFinalMedia(avs, Number(alunoId), criteriosGroup, fileDefs);
                        return result.total;
                    });
                    // 6. Set media_geral as the average of all students' final medias
                    const media = allMedias.length > 0 ? allMedias.reduce((a, b) => a + b, 0) / allMedias.length : 0;
                    logger.info(`Calculated new media_geral for problema ${id_problema} (NEW LOGIC): ${media}`);
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
            }

            return res.status(201).json(data);
        }),

        'get-avaliacoes': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            // Require authentication for getting avaliações
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }

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
            // Require authentication for uploading arquivos
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }

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
                // Generate unique filename with timestamp to allow multiple files
                const fileExtension = arquivoFile.name.split('.').pop();
                const timestamp = Date.now();
                const fileName = `aluno_problema/arquivo_${id_aluno}_${id_problema}_${nome_tipo}_${timestamp}.${fileExtension}`;

                // Upload to Supabase Storage (bucket: arquivos)
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('arquivos')
                    .upload(fileName, arquivoFile.data, {
                        contentType: arquivoFile.mimetype,
                        upsert: false // Don't overwrite existing files
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
            // Require authentication for getting arquivos
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }

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
        }),

        'delete-arquivo': new Pair(RequestType.DELETE, async (req: Request, res: Response) => {
            // Require authentication for deleting arquivos
            const authUser = await Utils.validateUser(req);
            if (!authUser) {
                return res.status(401).json({ error: 'Unauthorized: Valid authentication required' });
            }

            const { id_arquivo } = req.query;
            if (!id_arquivo) {
                return res.status(400).json({ error: 'id_arquivo is required' });
            }

            try {
                // Get file info before deleting
                const { data: fileData, error: fetchError } = await supabase
                    .from('arquivos_alunos_problema')
                    .select('*')
                    .eq('id_arquivo', id_arquivo)
                    .single();

                if (fetchError || !fileData) {
                    logger.error(`Error fetching arquivo ${id_arquivo}: ${fetchError?.message}`);
                    return res.status(404).json({ error: 'Arquivo not found' });
                }

                // Extract filename from signed URL
                const urlParts = fileData.link_arquivo?.split('/');
                const filenamePart = urlParts?.[urlParts.length - 1]?.split('?')[0];

                if (filenamePart) {
                    // Try to delete from storage (don't fail if file doesn't exist)
                    const { error: deleteStorageError } = await supabase.storage
                        .from('arquivos')
                        .remove([`aluno_problema/${filenamePart}`]);

                    if (deleteStorageError) {
                        logger.warn(`Could not delete file from storage: ${deleteStorageError.message}`);
                    } else {
                        logger.info(`Deleted file from storage: ${filenamePart}`);
                    }
                }

                // Delete from database
                const { error: deleteDbError } = await supabase
                    .from('arquivos_alunos_problema')
                    .delete()
                    .eq('id_arquivo', id_arquivo);

                if (deleteDbError) {
                    logger.error(`Error deleting arquivo from database: ${deleteDbError.message}`);
                    return res.status(500).json({ error: deleteDbError.message });
                }

                logger.info(`Successfully deleted arquivo ${id_arquivo}`);
                return res.status(204).send();
            } catch (error) {
                logger.error(`Error deleting arquivo ${id_arquivo}: ${error}`);
                return res.status(500).json({ error: 'Error deleting arquivo' });
            }
        })
    }
}; 