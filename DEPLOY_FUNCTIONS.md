# Deploy Manual das Edge Functions - Guia Rápido

Para completar o setup do sistema SaaS, você precisa deployar 2 Edge Functions.

## Opção 1: Via CLI (Mais Rápido)

Abra o terminal na pasta do projeto e rode:

```bash
# 1. Fazer login no Supabase (vai abrir o browser)
npx supabase login

# 2. Deploy da função de cadastro
npx supabase functions deploy saas-bootstrap --project-ref axjqigkhcyzkqseuzasz --no-verify-jwt

# 3. Deploy da função de convite
npx supabase functions deploy saas-invite --project-ref axjqigkhcyzkqseuzasz --no-verify-jwt
```

## Opção 2: Via Dashboard (Manual)

1. Acesse: https://supabase.com/dashboard/project/axjqigkhcyzkqseuzasz/functions
2. Clique em "Create a new function"
3. Nome: `saas-bootstrap`
4. Copie o código de: `e:\bjjacademy-main\supabase\functions\saas-bootstrap\index.ts`
5. Cole e clique em Deploy
6. Repita para `saas-invite`

## Após o Deploy

Teste criando uma nova academia em: http://localhost:8081/signup
