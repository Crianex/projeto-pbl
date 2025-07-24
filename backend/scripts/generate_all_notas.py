import csv
import json
import random

# List of alunos (edit as needed)
alunos = [19,20,22,23,24,25,27,28]
# The problem ID to use for all rows
id_problema = 24

# Function to generate random notas
def generate_notas():
    return {
        "Análise do Problema": {
            "conhecimento": round(random.uniform(0.6, 1.0), 1),
            "habilidades": round(random.uniform(1.1, 1.5), 1),
            "atitudes": round(random.uniform(1.1, 1.5), 1)
        },
        "Resolução do Problema": {
            "conhecimento": round(random.uniform(0.7, 1.0), 1),
            "habilidades": round(random.uniform(1.1, 1.5), 1),
            "atitudes": round(random.uniform(1.1, 1.5), 1)
        },
        "media": round(random.uniform(1.0, 1.5), 2)
    }

output_file = 'notas_sample_clean_all_pairs.csv'

with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(['id_aluno_avaliado', 'id_aluno_avaliador', 'id_problema', 'notas'])
    for id_aluno_avaliado in alunos:
        for id_aluno_avaliador in alunos:
            if id_aluno_avaliado != id_aluno_avaliador:
                notas = generate_notas()
                writer.writerow([
                    id_aluno_avaliado,
                    id_aluno_avaliador,
                    id_problema,
                    json.dumps(notas, ensure_ascii=False)
                ])

print(f"Done! Output written to {output_file}") 