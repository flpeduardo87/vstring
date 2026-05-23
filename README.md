<div align="center">
  <h1>🎾 VString - Sistema de Gerenciamento para Ateliers de Raquetaria</h1>
  <p>Solução completa para gestão de serviços, estoque, clientes e financeiro de ateliers especializados em encordoamento de raquetes</p>
</div>

---

## ✨ Funcionalidades

### 📋 Gestão de Clientes
- Cadastro completo de clientes com histórico de raquetes
- Rastreamento de padrões de encordoamento
- Contato via WhatsApp integrado

### 🔧 Gestão de Serviços
- Criação de ordens de serviço (OS) com numeração automática
- Controle de tensão de cordas (mains e crosses)
- Impressão de etiquetas e OS em PDF
- Status de serviço e pagamento
- Histórico completo de operações

### 📦 Controle de Estoque
- Gestão de cordas (rolos e unidades)
- Cálculo automático de preço de venda com margem
- Alerta de estoque baixo
- Código de barras para produtos

### 💰 Análise Financeira
- Dashboard de receita e lucro
- Análise de custos de materiais
- Gráficos de crescimento mensal
- Comparativo de períodos
- Cálculo automático de margem por serviço

### 🛒 PDV (Ponto de Venda)
- Venda rápida de produtos
- Integração com estoque
- Recibos em PDF

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 16+ instalado
- Conta Firebase (projeto criado)
- Gemini API Key (opcional)

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/vstring.git
   cd vstring
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env.local
   ```
   Edite `.env.local` e adicione suas credenciais:
   - `VITE_GEMINI_API_KEY` (se usar IA)

4. Execute o projeto:
   ```bash
   npm run dev
   ```

5. Abra no navegador:
   ```
   http://localhost:3000
   ```

---

## 🔧 Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão em `dist/`

---

## 📚 Tecnologias

- **Frontend:** React 19 + TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Firebase/Firestore
- **Autenticação:** Firebase Auth
- **Gráficos:** Recharts
- **PDF:** jsPDF + html2canvas
- **Build:** Vite

---

## 📝 Estrutura do Projeto

```
vstring/
├── src/
│   ├── components/        # Componentes React
│   │   ├── Auth.tsx      # Login/Autenticação
│   │   ├── Customers.tsx # Gestão de clientes
│   │   ├── Services.tsx  # Ordens de serviço
│   │   ├── Inventory.tsx # Estoque
│   │   ├── Financial.tsx # Dashboard financeiro
│   │   ├── POS.tsx       # Ponto de venda
│   │   └── ui/           # Componentes UI reutilizáveis
│   ├── lib/
│   │   ├── firebase.ts   # Configuração Firebase
│   │   └── utils.ts      # Utilitários
│   ├── App.tsx
│   └── main.tsx
├── firebase-applet-config.json # Configuração Firebase
├── firestore.rules              # Regras de segurança
├── package.json
└── README.md
```

---

## 🔐 Configuração Firebase

### Regras Firestore (firestore.rules)

AsRegras já estão configuradas para permitir operações CRUD em coleções de:
- `customers` - Clientes
- `services` - Ordens de serviço
- `inventory` - Estoque
- `sales` - Vendas

### Collections esperadas no Firestore:

```
customers/
  └── {customerId}/
      └── rackets/ (sub-collection)

services/

inventory/

sales/
```

---

## 📄 Licença

Este projeto é privado. Para mais informações, entre em contato.

---

## 🐛 Reportar Problemas

Encontre um bug? Abra uma [Issue](https://github.com/seu-usuario/vstring/issues)

---

**Desenvolvido com ❤️ para ateliers de raquetaria**
