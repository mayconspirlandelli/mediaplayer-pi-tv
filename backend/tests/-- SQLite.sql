-- SQLite
SELECT * FROM media WHERE tipo='imagem';

-- Ver agendamentos de imagens
SELECT 
    s.id,
    m.nome,
    s.regiao,
    s.data_inicio,
    s.ativo
FROM schedule s
JOIN media m ON s.media_id = m.id
WHERE m.tipo = 'imagem';

-- Ver agendamentos da região 2
SELECT * FROM schedule WHERE regiao = 2;


SELECT regiao, COUNT(*) as total FROM schedule GROUP BY regiao;


SELECT 
    s.id,
    m.nome,
    s.regiao,
    s.data_inicio,
    s.data_fim,
    s.hora_inicio,
    s.hora_fim,
    s.dias_semana,
    s.ativo
FROM schedule s
JOIN media m ON s.media_id = m.id
WHERE m.tipo = 'imagem';
