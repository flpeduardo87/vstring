# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [0.1.0] - 2026-05-23

### 🎯 Inicial

#### ✨ Adicionado
- ✅ Sistema completo de gerenciamento de ateliers de raquetaria
- ✅ Autenticação com Firebase Auth
- ✅ Gestão de clientes com histórico de raquetes
- ✅ Ordens de serviço (OS) com numeração automática
- ✅ Controle de estoque com cálculo de margem automática
- ✅ Dashboard financeiro com análise de lucro/receita
- ✅ PDV (Ponto de Venda) integrado
- ✅ Impressão de OS e etiquetas em PDF
- ✅ Integração com WhatsApp para contato com clientes
- ✅ Leitor de código de barras

#### 🔧 Corrigido
- 🐛 Firestore Database ID não configurado corretamente (adicionado `firestoreDatabaseId` ao inicializar)
- 🐛 Contraste de texto em tabelas de Serviços (alterado de preto para branco)
- 🐛 Contraste de texto em tabelas de Estoque (alterado de preto para branco)
- 🐛 Contraste de texto em cards de Financeiro (alterado de preto para branco)
- 🐛 Cache do Firestore causando sincronização lenta (implementado handler de erro)

#### 📚 Documentação
- 📝 README.md atualizado com instruções completas
- 📝 .gitignore configurado para projeto Node.js
- 📝 .env.example criado com variáveis necessárias
- 📝 Firestore rules validadas e atualizadas

#### 🚀 Melhorias Futuras
- [ ] Implementar backup automático de dados
- [ ] Adicionar suporte offline com sincronização
- [ ] Exportar relatórios em Excel
- [ ] Integrar com sistemas de pagamento (Stripe/PagSeguro)
- [ ] Autenticação multi-usuário com permissões
- [ ] Mobile app nativo (React Native)

---

## Como Relatar Mudanças

Use o formato abaixo ao registrar mudanças:

```markdown
### 🎯 [Versão] - YYYY-MM-DD

#### ✨ Adicionado
- Nova funcionalidade

#### 🔧 Corrigido
- Bug corrigido

#### 📚 Documentação
- Documentação adicionada

#### ⚠️ Breaking Changes
- Mudança que quebra compatibilidade
```

### Categorias:
- ✨ Adicionado
- 🔧 Corrigido  
- ⚡ Melhorado
- ⚠️ Breaking Changes
- 📚 Documentação
- 🗑️ Removido
