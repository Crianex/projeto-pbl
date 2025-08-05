import { EndpointController, RequestType } from '../../src/config/interfaces';
import { Request, Response } from 'express';
import { Pair } from '../../src/config/utils';
import { supabase } from '../../src/config/supabase_wrapper';
import { createControllerLogger } from '../../src/utils/controller_logger';
import { Utils } from '../../src/config/utils';

const logger = createControllerLogger('ComplexExample', 'Controller');

export const ComplexExampleController: EndpointController = {
    name: 'complex-example',
    routes: {
        // Complex query with joins and filtering
        'complex-query': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const {
                    status,
                    startDate,
                    endDate,
                    limit = '50',
                    page = '1',
                    sortBy = 'created_at',
                    sortOrder = 'desc'
                } = req.query;

                // Build complex query with joins
                let query = supabase
                    .from('evaluations')
                    .select(`
                        *,
                        problem:problems(*),
                        evaluator:students!evaluations_evaluator_id_fkey(*),
                        evaluated:students!evaluations_evaluated_id_fkey(*),
                        class:classes(*)
                    `);

                // Apply filters
                if (status) {
                    query = query.eq('status', status);
                }

                if (startDate) {
                    query = query.gte('created_at', startDate);
                }

                if (endDate) {
                    query = query.lte('created_at', endDate);
                }

                // Apply sorting
                query = query.order(sortBy as string, {
                    ascending: sortOrder === 'asc'
                });

                // Apply pagination
                const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
                const pageNum = Math.max(1, parseInt(page as string));
                const offset = (pageNum - 1) * limitNum;

                query = query.range(offset, offset + limitNum - 1);

                // Execute query
                const { data, error, count } = await query;

                if (error) {
                    logger.error(`Database error: ${error.message}`);
                    return res.status(500).json({ error: error.message });
                }

                logger.info(`Successfully fetched ${data?.length || 0} evaluations for user ${authUser.id}`);

                return res.json({
                    data: data || [],
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total: count || 0,
                        totalPages: Math.ceil((count || 0) / limitNum)
                    }
                });
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        // Transaction example
        'transaction-example': new Pair(RequestType.POST, async (req: Request, res: Response) => {
            try {
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const { problemId, evaluations } = req.body;

                // Validation
                if (!problemId || !evaluations || !Array.isArray(evaluations)) {
                    return res.status(400).json({ error: 'Invalid request data' });
                }

                // Start transaction-like operations
                const results = [];
                const errors = [];

                for (const evaluation of evaluations) {
                    try {
                        // Insert evaluation
                        const { data: evalData, error: evalError } = await supabase
                            .from('evaluations')
                            .insert([{
                                problem_id: problemId,
                                evaluator_id: evaluation.evaluatorId,
                                evaluated_id: evaluation.evaluatedId,
                                grades: JSON.stringify(evaluation.grades),
                                created_by: authUser.id
                            }])
                            .select()
                            .single();

                        if (evalError) {
                            errors.push(`Failed to insert evaluation: ${evalError.message}`);
                            continue;
                        }

                        results.push(evalData);

                        // Update problem statistics
                        const { error: statsError } = await supabase
                            .from('problems')
                            .update({
                                evaluation_count: supabase.rpc('increment', { n: 1 }),
                                last_updated: new Date().toISOString()
                            })
                            .eq('id', problemId);

                        if (statsError) {
                            logger.warn(`Failed to update problem statistics: ${statsError.message}`);
                        }

                    } catch (err) {
                        errors.push(`Error processing evaluation: ${err}`);
                    }
                }

                if (errors.length > 0) {
                    logger.error(`Transaction completed with errors: ${errors.join(', ')}`);
                    return res.status(207).json({ // 207 Multi-Status
                        message: 'Transaction completed with some errors',
                        results,
                        errors
                    });
                }

                logger.info(`Successfully processed ${results.length} evaluations for user ${authUser.id}`);
                return res.status(201).json({
                    message: 'All evaluations processed successfully',
                    results
                });
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        // Aggregation and statistics
        'statistics': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const { problemId, classId } = req.query;

                if (!problemId) {
                    return res.status(400).json({ error: 'Problem ID is required' });
                }

                // Get evaluation statistics
                const { data: evaluations, error: evalError } = await supabase
                    .from('evaluations')
                    .select('grades, created_at')
                    .eq('problem_id', problemId);

                if (evalError) {
                    logger.error(`Database error: ${evalError.message}`);
                    return res.status(500).json({ error: evalError.message });
                }

                // Calculate statistics
                const stats = {
                    totalEvaluations: evaluations?.length || 0,
                    averageGrade: 0,
                    gradeDistribution: {},
                    recentActivity: 0
                };

                if (evaluations && evaluations.length > 0) {
                    // Calculate average grade
                    let totalGrade = 0;
                    let validGrades = 0;

                    evaluations.forEach(eval => {
                        try {
                            const grades = JSON.parse(eval.grades);
                            const gradeSum = Object.values(grades).reduce((sum: number, grade: any) => sum + (grade || 0), 0);
                            totalGrade += gradeSum;
                            validGrades++;
                        } catch (err) {
                            logger.warn(`Invalid grades format for evaluation: ${err}`);
                        }
                    });

                    stats.averageGrade = validGrades > 0 ? totalGrade / validGrades : 0;

                    // Calculate grade distribution
                    evaluations.forEach(eval => {
                        try {
                            const grades = JSON.parse(eval.grades);
                            Object.values(grades).forEach((grade: any) => {
                                const gradeRange = Math.floor(grade / 10) * 10;
                                stats.gradeDistribution[gradeRange] = (stats.gradeDistribution[gradeRange] || 0) + 1;
                            });
                        } catch (err) {
                            logger.warn(`Invalid grades format for evaluation: ${err}`);
                        }
                    });

                    // Calculate recent activity (last 7 days)
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                    stats.recentActivity = evaluations.filter(eval =>
                        new Date(eval.created_at) > oneWeekAgo
                    ).length;
                }

                logger.info(`Generated statistics for problem ${problemId} for user ${authUser.id}`);
                return res.json(stats);
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        // Search with multiple criteria
        'search': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const {
                    q, // search query
                    type, // resource type
                    status,
                    dateFrom,
                    dateTo,
                    tags
                } = req.query;

                // Build search query
                let query = supabase.from('resources').select('*');

                // Text search
                if (q) {
                    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
                }

                // Type filter
                if (type) {
                    query = query.eq('type', type);
                }

                // Status filter
                if (status) {
                    query = query.eq('status', status);
                }

                // Date range
                if (dateFrom) {
                    query = query.gte('created_at', dateFrom);
                }

                if (dateTo) {
                    query = query.lte('created_at', dateTo);
                }

                // Tags filter (assuming tags is a JSON field)
                if (tags) {
                    const tagArray = Array.isArray(tags) ? tags : [tags];
                    tagArray.forEach(tag => {
                        query = query.contains('tags', [tag]);
                    });
                }

                // Apply user-specific filters
                switch (authUser.type) {
                    case 'aluno':
                        query = query.eq('student_id', authUser.id);
                        break;
                    case 'professor':
                        query = query.eq('professor_id', authUser.id);
                        break;
                    case 'coordenador':
                        // Coordinators can see all resources
                        break;
                    default:
                        return res.status(403).json({ error: 'Invalid user type' });
                }

                // Execute search
                const { data, error } = await query;

                if (error) {
                    logger.error(`Search error: ${error.message}`);
                    return res.status(500).json({ error: error.message });
                }

                logger.info(`Search completed for user ${authUser.id}, found ${data?.length || 0} results`);
                return res.json({
                    results: data || [],
                    total: data?.length || 0,
                    query: { q, type, status, dateFrom, dateTo, tags }
                });
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        // Bulk operations
        'bulk-update': new Pair(RequestType.PUT, async (req: Request, res: Response) => {
            try {
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const { updates } = req.body;

                if (!updates || !Array.isArray(updates)) {
                    return res.status(400).json({ error: 'Updates array is required' });
                }

                // Validate updates
                const validUpdates = updates.filter(update =>
                    update.id && (update.status || update.name || update.description)
                );

                if (validUpdates.length === 0) {
                    return res.status(400).json({ error: 'No valid updates provided' });
                }

                // Process updates in batches
                const batchSize = 10;
                const results = [];
                const errors = [];

                for (let i = 0; i < validUpdates.length; i += batchSize) {
                    const batch = validUpdates.slice(i, i + batchSize);

                    for (const update of batch) {
                        try {
                            const { data, error } = await supabase
                                .from('resources')
                                .update({
                                    status: update.status,
                                    name: update.name,
                                    description: update.description,
                                    updated_by: authUser.id,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', update.id)
                                .select()
                                .single();

                            if (error) {
                                errors.push(`Failed to update ${update.id}: ${error.message}`);
                            } else {
                                results.push(data);
                            }
                        } catch (err) {
                            errors.push(`Error updating ${update.id}: ${err}`);
                        }
                    }
                }

                logger.info(`Bulk update completed for user ${authUser.id}: ${results.length} successful, ${errors.length} failed`);

                return res.json({
                    message: 'Bulk update completed',
                    successful: results.length,
                    failed: errors.length,
                    results,
                    errors
                });
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }),

        // Data export
        'export': new Pair(RequestType.GET, async (req: Request, res: Response) => {
            try {
                const authUser = await Utils.validateUser(req);
                if (!authUser) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const { format = 'json', problemId } = req.query;

                if (!problemId) {
                    return res.status(400).json({ error: 'Problem ID is required' });
                }

                // Fetch data with joins
                const { data, error } = await supabase
                    .from('evaluations')
                    .select(`
                        *,
                        problem:problems(*),
                        evaluator:students!evaluations_evaluator_id_fkey(*),
                        evaluated:students!evaluations_evaluated_id_fkey(*)
                    `)
                    .eq('problem_id', problemId);

                if (error) {
                    logger.error(`Database error: ${error.message}`);
                    return res.status(500).json({ error: error.message });
                }

                // Format data based on requested format
                let formattedData;
                let contentType;

                switch (format) {
                    case 'csv':
                        // Convert to CSV format
                        const csvHeaders = ['ID', 'Evaluator', 'Evaluated', 'Grades', 'Created At'];
                        const csvRows = data?.map(eval => [
                            eval.id,
                            eval.evaluator?.name || 'Unknown',
                            eval.evaluated?.name || 'Unknown',
                            eval.grades,
                            eval.created_at
                        ]) || [];

                        formattedData = [csvHeaders, ...csvRows]
                            .map(row => row.map(cell => `"${cell}"`).join(','))
                            .join('\n');
                        contentType = 'text/csv';
                        break;

                    case 'xml':
                        // Convert to XML format
                        formattedData = `<?xml version="1.0" encoding="UTF-8"?>
<evaluations>
${data?.map(eval => `
  <evaluation>
    <id>${eval.id}</id>
    <evaluator>${eval.evaluator?.name || 'Unknown'}</evaluator>
    <evaluated>${eval.evaluated?.name || 'Unknown'}</evaluated>
    <grades>${eval.grades}</grades>
    <created_at>${eval.created_at}</created_at>
  </evaluation>`).join('') || ''}
</evaluations>`;
                        contentType = 'application/xml';
                        break;

                    default: // json
                        formattedData = JSON.stringify(data, null, 2);
                        contentType = 'application/json';
                        break;
                }

                logger.info(`Data exported for problem ${problemId} by user ${authUser.id} in ${format} format`);

                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `attachment; filename="evaluations_${problemId}.${format}"`);
                return res.send(formattedData);
            } catch (err) {
                logger.error(`Unexpected error: ${err}`);
                return res.status(500).json({ error: 'Internal server error' });
            }
        })
    }
}; 