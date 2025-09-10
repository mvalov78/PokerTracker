# 🔑 Как получить Service Role Key

## 📋 Шаги:

1. **Откройте Supabase Dashboard**: https://supabase.com/dashboard
2. **Выберите проект**: eyytlxntilefnmkhjgot  
3. **Перейдите в Settings → API**
4. **Найдите секцию "Project API keys"**
5. **Скопируйте `service_role` ключ** (НЕ anon!)

## ⚠️ ВАЖНО:
- Service Role Key **НЕ ДОЛЖЕН** начинаться с `eyJhbGci...` (это anon key)
- Service Role Key **ДОЛЖЕН** начинаться с `eyJhbGci...` но быть длиннее anon ключа
- Это **секретный ключ** - не публикуйте его!

## 🔧 После получения:

Обновите `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=ваш-настоящий-service-role-ключ
```

Затем перезапустите сервер:
```bash
npm run dev
```
