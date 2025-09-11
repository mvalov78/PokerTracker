-- Исправляем таблицу telegram_linking_codes
-- Добавляем уникальное ограничение на user_id, чтобы у каждого пользователя был только один активный код

-- Сначала удаляем дублирующие записи (если есть)
DELETE FROM public.telegram_linking_codes t1 
WHERE t1.id NOT IN (
    SELECT MIN(t2.id) 
    FROM public.telegram_linking_codes t2 
    WHERE t2.user_id = t1.user_id
);

-- Добавляем уникальное ограничение на user_id
ALTER TABLE public.telegram_linking_codes 
ADD CONSTRAINT unique_user_linking_code UNIQUE (user_id);

-- Проверяем структуру таблицы
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'telegram_linking_codes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Проверяем ограничения
SELECT 
    constraint_name, 
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'telegram_linking_codes' 
AND tc.table_schema = 'public';

