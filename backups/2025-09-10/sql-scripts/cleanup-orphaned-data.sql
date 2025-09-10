-- Скрипт для очистки потенциально "сиротских" данных
-- Этот скрипт поможет найти и удалить данные, которые ссылаются на несуществующие турниры

-- 1. Найти результаты турниров без соответствующих турниров
SELECT 
    tr.id,
    tr.tournament_id,
    tr.position,
    tr.payout,
    'Orphaned tournament result' as issue
FROM tournament_results tr
LEFT JOIN tournaments t ON tr.tournament_id = t.id
WHERE t.id IS NULL;

-- 2. Найти фотографии турниров без соответствующих турниров
SELECT 
    tp.id,
    tp.tournament_id,
    tp.url,
    'Orphaned tournament photo' as issue
FROM tournament_photos tp
LEFT JOIN tournaments t ON tp.tournament_id = t.id
WHERE t.id IS NULL;

-- 3. Найти транзакции банкролла, связанные с несуществующими турнирами
SELECT 
    bt.id,
    bt.tournament_id,
    bt.type,
    bt.amount,
    'Orphaned bankroll transaction' as issue
FROM bankroll_transactions bt
WHERE bt.tournament_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM tournaments t WHERE t.id = bt.tournament_id
);

-- ВНИМАНИЕ: Следующие команды УДАЛЯЮТ данные!
-- Раскомментируйте только после проверки результатов выше

-- 4. Удалить сиротские результаты турниров
-- DELETE FROM tournament_results 
-- WHERE tournament_id NOT IN (SELECT id FROM tournaments);

-- 5. Удалить сиротские фотографии турниров
-- DELETE FROM tournament_photos 
-- WHERE tournament_id NOT IN (SELECT id FROM tournaments);

-- 6. Очистить ссылки на несуществующие турниры в транзакциях банкролла
-- UPDATE bankroll_transactions 
-- SET tournament_id = NULL 
-- WHERE tournament_id IS NOT NULL 
-- AND tournament_id NOT IN (SELECT id FROM tournaments);

-- 7. Показать статистику после очистки
SELECT 
    'tournaments' as table_name,
    COUNT(*) as count
FROM tournaments
UNION ALL
SELECT 
    'tournament_results' as table_name,
    COUNT(*) as count
FROM tournament_results
UNION ALL
SELECT 
    'tournament_photos' as table_name,
    COUNT(*) as count
FROM tournament_photos
UNION ALL
SELECT 
    'bankroll_transactions' as table_name,
    COUNT(*) as count
FROM bankroll_transactions;
