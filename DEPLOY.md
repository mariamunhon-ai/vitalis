# 🚀 Vitalis — Guia de Deploy Completo
### Do zero ao app no ar, sem saber programar

---

## O que você vai ter no final

- **vitalis.app** — app para alunos e nutricionistas (instalável no celular)
- **vitalis.app/admin** — painel exclusivo seu, login separado
- Dados seguros com Supabase (banco de dados + autenticação)
- Deploy automático no Vercel

**Tempo estimado:** 1 a 2 horas  
**Custo inicial:** R$ 0

---

## Pré-requisitos — instale antes de começar

### Node.js
1. Acesse **nodejs.org** e baixe a versão **LTS**
2. Instale normalmente (Next em tudo)
3. Confirme: abra o Terminal e digite `node --version`
   → Deve aparecer algo como `v20.11.0`

### Git
- **Windows:** baixe em **git-scm.com/download/windows**, instale com Next
- **Mac:** abra o Terminal, digite `git --version`, clique em Install se pedir

---

## PARTE 1 — Criar as contas gratuitas

### 1.1 GitHub
1. Acesse **github.com** → Sign up
2. Confirme o e-mail recebido

### 1.2 Supabase
1. Acesse **supabase.com** → Start your project
2. Login com GitHub
3. Clique em **New project**:
   - Name: `vitalis`
   - Database Password: crie uma senha forte e **guarde em local seguro**
   - Region: **South America (São Paulo)**
4. Aguarde ~2 minutos para criar

### 1.3 Vercel
1. Acesse **vercel.com** → Sign Up → Continue with GitHub

---

## PARTE 2 — Configurar o banco de dados

### 2.1 Rodar o schema principal
1. No Supabase, clique em seu projeto → **SQL Editor** → **New query**
2. Abra o arquivo `supabase_schema.sql` do ZIP
3. Copie todo o conteúdo e cole no editor
4. Clique em **Run** → deve aparecer "Success"

### 2.2 Criar seu usuário admin
1. No Supabase → **Authentication** → **Users** → **Add user** → **Create new user**
2. Preencha com **seu e-mail** e uma senha forte
3. Clique em **Create user**
4. Copie o **UID** exibido (código longo tipo `abc123-def456-...`)
5. Volte em **SQL Editor** e rode este comando substituindo o UID:

```sql
INSERT INTO profiles (id, role, name, email, status)
VALUES ('COLE-O-UID-AQUI', 'admin', 'Admin Vitalis', 'seu@email.com', 'ativo')
ON CONFLICT (id) DO NOTHING;
```

### 2.3 Pegar as chaves de acesso
1. No Supabase → **Settings** → **API**
2. Copie e guarde:
   - **Project URL** — começa com `https://`
   - **anon public** — começa com `eyJ...`

---

## PARTE 3 — Colocar o código no GitHub

### 3.1 Configurar o .env
1. Na pasta do projeto, copie `.env.example` e renomeie para `.env`
2. Abra o `.env` com o Bloco de Notas (Windows) ou TextEdit (Mac)
3. Preencha:
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
4. Salve o arquivo

> ⚠️ O `.env` nunca vai para o GitHub — já está no `.gitignore`.

### 3.2 Criar repositório e enviar o código
Abra o Terminal na pasta do projeto e rode:

```bash
git init
git add .
git commit -m "Vitalis v1.0"
```

No GitHub:
1. Clique em **+** → **New repository**
2. Name: `vitalis`, deixe **Private**
3. Clique em **Create repository**
4. Copie e rode os dois comandos que o GitHub mostra:

```bash
git remote add origin https://github.com/SEU_USUARIO/vitalis.git
git push -u origin main
```

> Na senha, use um **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens → Tokens classic → Generate, marque `repo`)

---

## PARTE 4 — Publicar no Vercel

1. Acesse **vercel.com** → **Add New** → **Project**
2. Clique em **Import** ao lado do repositório `vitalis`
3. Framework: **Vite**
4. Expanda **Environment Variables** e adicione:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | sua URL do Supabase |
| `VITE_SUPABASE_ANON_KEY` | sua chave anon |

5. Clique em **Deploy** e aguarde ~2 minutos
6. Seu app estará em `vitalis-xyz.vercel.app` 🎉

---

## PARTE 5 — Como cada perfil acessa

### Aluno (celular)
**Android:** abra o Chrome → acesse o link → banner "Adicionar à tela inicial"  
**iPhone:** abra o Safari → compartilhar → "Adicionar à Tela de Início"

### Nutricionista (computador ou celular)
Acesse o link no navegador. No Chrome: ícone de instalação na barra de endereço.

### Você (admin)
Acesse `seuapp.vercel.app` e faça login com o e-mail que você criou no Supabase.  
O sistema detecta que é admin e redireciona automaticamente para o painel de controle.

> ⚠️ **Não existe URL separada `/admin`** — o roteamento é feito pelo login. Quem tem `role = admin` vai para o painel admin. Quem tem `role = nutricionista` vai para o painel dela. Quem tem `role = aluno` vai para o app do aluno.

---

## PARTE 6 — Cadastrar a primeira nutricionista

1. Supabase → **Authentication** → **Users** → **Add user** → **Create new user**
2. Preencha e-mail e senha da nutricionista
3. Copie o UID
4. Rode no SQL Editor:

```sql
INSERT INTO profiles (id, role, name, email, plan, plan_valor, start_date, paid_until, status)
VALUES (
  'UID-DA-NUTRICIONISTA',
  'nutricionista',
  'Nome da Nutricionista',
  'email@dela.com',
  'mensal',
  89,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 month',
  'ativo'
);
```

5. Envie e-mail e senha para ela
6. Para ativar ou bloquear, use o painel admin

---

## PARTE 7 — Domínio próprio (opcional)

1. Compre em **registro.br** (.com.br) ou **namecheap.com** (.com, .app)
2. No Vercel → seu projeto → **Settings** → **Domains** → **Add**
3. Digite seu domínio e siga as instruções de DNS
4. Em até 24h estará ativo

---

## PARTE 8 — Atualizações futuras

Sempre que modificar o app:

```bash
git add .
git commit -m "Descrição da mudança"
git push
```

O Vercel detecta e publica automaticamente em ~1 minuto.

---

## Solução de problemas comuns

| Problema | Solução |
|----------|---------|
| `npm error` ao rodar `npm install` | Rode `npm install --legacy-peer-deps` |
| Tela em branco no app | Verifique se o `.env` está preenchido corretamente |
| Login não funciona | Supabase → Authentication → Providers → Email habilitado |
| "User not found" após login | Verifique se o perfil foi criado na tabela `profiles` |
| Admin vê tela de aluno | Verifique se o perfil tem `role = 'admin'` no banco |
| App não instala no celular | Verifique se está acessando via HTTPS (Vercel já usa) |
| Dados não salvam | Supabase → Table Editor → verifique se RLS está ativo |

---

## Estrutura do projeto

```
vitalis/
├── src/
│   ├── App.jsx          ← componente principal (toda a UI)
│   ├── main.jsx         ← entry point
│   └── lib/
│       └── supabase.js  ← todas as chamadas ao banco
├── public/              ← ícones e favicon
├── supabase_schema.sql  ← rode uma vez no Supabase
├── package.json
├── vite.config.js       ← configuração do PWA
├── vercel.json          ← roteamento SPA
└── .env                 ← suas chaves (não vai pro GitHub)
```

---

*Qualquer dúvida ou erro, me manda a mensagem exata que aparece na tela.*
