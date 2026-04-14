# 🚀 Guia Completo — Colocar o Vitalis no Ar
### Do zero ao app instalável no celular, sem saber programar

---

## O que você vai ter no final

- **vitalis.app** (ou o domínio que você escolher) — app para alunos e nutricionistas
- **vitalis.app/admin** — painel exclusivo seu de controle
- App **instalável no celular** (Android e iPhone) sem precisar de App Store
- App também funciona **no computador** pelo navegador (para as nutricionistas)
- **Banco de dados seguro** com todos os dados separados por usuário

**Tempo estimado:** 1 a 2 horas seguindo este guia.
**Custo:** R$ 0 para começar.

---

## Ferramentas que você vai usar (todas gratuitas)

| Ferramenta | Para que serve | Site |
|---|---|---|
| **GitHub** | Guardar o código do app | github.com |
| **Vercel** | Colocar o app na internet | vercel.com |
| **Supabase** | Banco de dados e login dos usuários | supabase.com |

---

## PARTE 1 — Criar as contas

### 1.1 — Criar conta no GitHub

1. Acesse **github.com**
2. Clique em **Sign up**
3. Digite seu e-mail, crie uma senha e um nome de usuário
4. Confirme o e-mail que chegou na sua caixa de entrada
5. Pronto ✓

---

### 1.2 — Criar conta no Supabase

1. Acesse **supabase.com**
2. Clique em **Start your project**
3. Clique em **Continue with GitHub** (use a conta que você acabou de criar)
4. Autorize o acesso
5. Clique em **New project**
6. Preencha:
   - **Organization:** seu nome ou "Vitalis"
   - **Name:** `vitalis`
   - **Database Password:** crie uma senha forte e **guarde em algum lugar seguro**
   - **Region:** escolha **South America (São Paulo)**
7. Clique em **Create new project**
8. Aguarde ~2 minutos enquanto o banco é criado
9. Pronto ✓

---

### 1.3 — Criar conta no Vercel

1. Acesse **vercel.com**
2. Clique em **Sign Up**
3. Clique em **Continue with GitHub**
4. Autorize o acesso
5. Pronto ✓

---

## PARTE 2 — Configurar o banco de dados (Supabase)

### 2.1 — Criar as tabelas

1. No Supabase, clique no seu projeto **vitalis**
2. No menu esquerdo, clique em **SQL Editor**
3. Clique em **New query**
4. Abra o arquivo `supabase_schema.sql` que está na pasta do projeto
5. Copie **todo o conteúdo** do arquivo
6. Cole no editor do Supabase
7. Clique em **Run** (botão verde no canto inferior direito)
8. Deve aparecer "Success. No rows returned"
9. Pronto ✓

---

### 2.2 — Pegar as chaves de acesso

Você vai precisar de duas informações do Supabase:

1. No menu esquerdo, clique em **Settings** (ícone de engrenagem)
2. Clique em **API**
3. Você vai ver dois valores. Copie e guarde:
   - **Project URL** — parece com `https://abcdefghij.supabase.co`
   - **anon public** (em Project API Keys) — uma chave longa começando com `eyJ...`

Guarde esses dois valores, você vai precisar deles no próximo passo.

---

### 2.3 — Configurar autenticação

1. No menu esquerdo, clique em **Authentication**
2. Clique em **Providers**
3. Certifique-se que **Email** está habilitado (deve estar por padrão)
4. Clique em **Email** para ver as configurações
5. Desative **Confirm email** por enquanto (para facilitar os testes)
   > Você pode reativar depois quando for ao ar de verdade
6. Clique em **Save**

---

### 2.4 — Criar seu usuário admin no banco

1. No menu esquerdo, clique em **Authentication**
2. Clique em **Users**
3. Clique em **Add user > Create new user**
4. Preencha:
   - **Email:** `admin@vitalis.app` (ou seu e-mail pessoal)
   - **Password:** crie uma senha forte
5. Clique em **Create user**
6. Copie o **User UID** que aparece (é um código tipo `123e4567-e89b...`)
7. Agora vá em **SQL Editor** e rode este comando (substituindo o UID pelo que você copiou):

```sql
INSERT INTO profiles (id, role, name, email, status)
VALUES ('COLE_O_UID_AQUI', 'admin', 'Admin Vitalis', 'admin@vitalis.app', 'ativo');
```

---

## PARTE 3 — Colocar o código no GitHub

### 3.1 — Instalar o Git no seu computador

**Windows:**
1. Acesse **git-scm.com/download/windows**
2. Baixe e instale (pode clicar Next em tudo)

**Mac:**
1. Abra o Terminal (busque "Terminal" no Spotlight)
2. Digite `git --version` e pressione Enter
3. Se pedir para instalar, clique em Install

---

### 3.2 — Instalar o Node.js

1. Acesse **nodejs.org**
2. Baixe a versão **LTS** (a recomendada)
3. Instale (pode clicar Next em tudo)
4. Para confirmar, abra o Terminal/Prompt e digite:
   ```
   node --version
   ```
   Deve aparecer algo como `v20.11.0`

---

### 3.3 — Baixar os arquivos do projeto

Os arquivos do Vitalis estão no arquivo ZIP que você recebeu. Extraia em uma pasta fácil de encontrar, por exemplo:
- Windows: `C:\Users\SeuNome\vitalis`
- Mac: `/Users/SeuNome/vitalis`

---

### 3.4 — Configurar o arquivo de ambiente (.env)

1. Dentro da pasta do projeto, você vai ver um arquivo chamado `.env.example`
2. Faça uma cópia dele e renomeie para `.env`
3. Abra o `.env` com o Bloco de Notas (Windows) ou TextEdit (Mac)
4. Preencha com os valores do Supabase que você guardou:

```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ADMIN_PASSWORD=vitalis2026
```

5. Salve o arquivo

> ⚠️ **Importante:** O arquivo `.env` nunca vai para o GitHub (já está no .gitignore). Suas chaves ficam seguras.

---

### 3.5 — Criar repositório no GitHub e enviar o código

Abra o Terminal (Mac) ou Prompt de Comando (Windows) e execute os comandos abaixo, um por vez:

```bash
# Entre na pasta do projeto
cd C:\Users\SeuNome\vitalis
# (Mac: cd /Users/SeuNome/vitalis)

# Inicie o git
git init

# Adicione todos os arquivos
git add .

# Faça o primeiro commit
git commit -m "Primeiro commit - Vitalis"
```

Agora vá ao GitHub:
1. Clique no **+** no canto superior direito
2. Clique em **New repository**
3. Name: `vitalis`
4. Deixe como **Private** (privado)
5. Clique em **Create repository**
6. O GitHub vai mostrar alguns comandos. Copie e execute no terminal os dois últimos:

```bash
git remote add origin https://github.com/SEU_USUARIO/vitalis.git
git push -u origin main
```

7. Vai pedir seu usuário e senha do GitHub. Na senha, use um **Personal Access Token**:
   - Acesse github.com > clique na sua foto > Settings
   - Role até **Developer settings** > **Personal access tokens** > **Tokens (classic)**
   - Clique em **Generate new token**
   - Marque **repo** e gere o token
   - Use esse token como senha

---

## PARTE 4 — Publicar no Vercel

### 4.1 — Conectar o repositório

1. Acesse **vercel.com** e faça login
2. Clique em **Add New > Project**
3. Clique em **Import** ao lado do repositório `vitalis`
4. Em **Framework Preset**, selecione **Vite**
5. Expanda **Environment Variables** e adicione as três variáveis:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | sua URL do Supabase |
| `VITE_SUPABASE_ANON_KEY` | sua chave anon do Supabase |
| `VITE_ADMIN_PASSWORD` | sua senha admin |

6. Clique em **Deploy**
7. Aguarde ~2 minutos
8. Vai aparecer um link tipo `vitalis-abc123.vercel.app`
9. Clique no link — seu app está no ar! 🎉

---

### 4.2 — Configurar domínio personalizado (opcional)

Se você quiser usar `vitalis.com.br` ou similar:

1. Compre um domínio em **registro.br** (para .com.br) ou **namecheap.com** (para .com, .app)
2. No Vercel, vá em seu projeto > **Settings > Domains**
3. Clique em **Add Domain** e digite seu domínio
4. O Vercel vai mostrar registros DNS para configurar
5. No seu registrador de domínio, adicione esses registros DNS
6. Em até 24h o domínio estará funcionando

---

## PARTE 5 — Como as pessoas vão usar o app

### Para o ALUNO

**No celular (Android):**
1. Abra o Chrome
2. Acesse o link do app (ex: `vitalis.app`)
3. Vai aparecer um banner "Adicionar à tela inicial"
4. Toque em **Adicionar**
5. O app aparece na tela como qualquer outro aplicativo ✓

**No celular (iPhone):**
1. Abra o Safari (precisa ser o Safari)
2. Acesse o link do app
3. Toque no botão de compartilhar (quadrado com seta para cima)
4. Role e toque em **Adicionar à Tela de Início**
5. Toque em **Adicionar** ✓

---

### Para a NUTRICIONISTA

**No celular:** mesma forma que o aluno

**No computador:**
1. Abra qualquer navegador (Chrome, Edge, Firefox)
2. Acesse o link do app
3. Funciona direto no navegador, sem instalar nada
4. Para instalar como app no computador: no Chrome, clique no ícone de computador na barra de endereço e clique em **Instalar**

---

### Para VOCÊ (Admin)

1. Acesse `vitalis.app/admin` (ou seu domínio + /admin)
2. Faça login com o e-mail e senha que você criou no Supabase
3. Pronto — acesso exclusivo ao painel de controle

---

## PARTE 6 — Cadastrar a primeira nutricionista

1. Acesse **supabase.com** > seu projeto > **Authentication > Users**
2. Clique em **Add user > Create new user**
3. Preencha e-mail e senha da nutricionista
4. Clique em **Create user**
5. Copie o UID gerado
6. Vá em **SQL Editor** e execute:

```sql
INSERT INTO profiles (id, role, name, email, plan, plan_valor, start_date, paid_until, status)
VALUES (
  'COLE_O_UID_AQUI',
  'nutri',
  'Nome da Nutricionista',
  'email@dela.com',
  'anual',
  599,
  '2026-04-08',
  '2027-04-08',
  'ativo'
);
```

7. Envie o e-mail e senha para ela
8. Ela acessa o app e já entra no painel de nutricionista

---

## PARTE 7 — Atualizações futuras

Sempre que você quiser atualizar o app (adicionar funcionalidades, corrigir algo):

1. Faça as alterações nos arquivos
2. Abra o terminal na pasta do projeto
3. Execute:
```bash
git add .
git commit -m "Descrição do que mudou"
git push
```
4. O Vercel detecta automaticamente e publica a nova versão em ~1 minuto

---

## Resumo dos acessos

| Quem | Endereço | Credenciais |
|------|----------|-------------|
| Alunos | vitalis.app | E-mail e senha criados pelo link da nutri |
| Nutricionistas | vitalis.app | E-mail e senha que você cadastrou |
| Você (admin) | vitalis.app/admin | E-mail e senha que você definiu no Supabase |

---

## Problemas comuns

**"Cannot find module" ao rodar npm run dev**
→ Execute `npm install` primeiro na pasta do projeto

**App abre mas aparece tela em branco**
→ Verifique se o arquivo `.env` está preenchido corretamente com as chaves do Supabase

**Login não funciona**
→ Verifique no Supabase > Authentication > Providers se o e-mail está habilitado

**/admin não abre**
→ Verifique se o `vercel.json` está na pasta do projeto (ele faz o roteamento funcionar)

---

## Precisa de ajuda?

Me mande uma mensagem descrevendo o problema exatamente como aparece na tela.
Posso resolver qualquer erro que aparecer durante o processo.
