# Schema do IndexedDB — Nova VRVS

**Autor:** Claude (Opus), arquiteto de produto/dados
**Versão do documento:** 2.0 (consolidada)
**Status:** especificação técnica fechada, sem pendências em aberto.
**Escopo:** define a estrutura concreta do banco local da nova VRVS, em IndexedDB.
**O que este documento NÃO é:** não é código, não é prompt para Cursor, não trata de backend.

**Histórico:**
- **V1.0** — primeira proposta com 7 pendências marcadas para revisão.
- **V2.0** — todas as 7 pendências resolvidas e aplicadas no corpo do documento. Detalhes em §12.

**Convenção:**
- **[FATO]** — decidido em documento anterior ou trava do projeto.
- **[CONSEQUÊNCIA]** — dedução direta de uma decisão anterior.
- **[APOSTA]** — proposta minha, sujeita a discussão.
- **[DECIDIDO]** — pendência da V1 que foi resolvida na V2.

---

## Sumário

1. Object stores
2. KeyPaths
3. Índices secundários
4. Relações entre stores
5. schemaVersion
6. Estratégia de migração entre versões
7. Regras de integridade
8. Persistido vs. derivado
9. Contratos básicos de leitura/escrita
10. Faseamento (Fase 1 / Fase 2)
11. Comportamento defensivo no Safari iOS / PWA
12. Decisões consolidadas (V2)

---

# 1. Object stores

Um object store por entidade do Mapa de Domínio, mais um store de sistema (`_meta`).

## 1.1 Stores na Fase 1

| Store | Conteúdo | Origem (Mapa de Domínio) |
|---|---|---|
| `_meta` | sentinela e estado operacional do banco | (sistema) |
| `profiles` | perfis de usuário | Profile |
| `appSettings` | configurações globais (singleton) | AppSettings |
| `backupMetadata` | log de backups gerados | BackupMetadata |
| `areas` | áreas (taxonomia de Temas) | Area |
| `temas` | temas | Tema |
| `cards` | cards (com estado VRVS 3P como cache) | Card |
| `cardReviews` | eventos imutáveis de revisão de cards | CardReview |
| `sessions` | sessões de estudo (`study` / `review`) | Sessão |
| `agendaItems` | itens materializados da Agenda | AgendaItem |
| `captures` | inbox de captures | Capture |

**Total Fase 1: 11 stores.**

## 1.2 Stores reservadas para Fase 2

| Store | Conteúdo |
|---|---|
| `notes` | Note (entidade própria, hoje coberta por `Tema.notes`) |
| `reminders` | Reminder (se decidirmos criar — pode nunca existir) |

Esses stores NÃO são criados na Fase 1. A migração que os introduz vive em uma versão posterior do schema (ver §5 e §6).

## 1.3 Princípios gerais

- **Um store por entidade lógica.** Sem stores polimórficos disfarçados.
- **`agendaItems` é o único caso polimórfico**, com referência via `targetType` + `targetId`. Decisão consciente, registrada no Mapa de Domínio. **[FATO]**
- **`appSettings` é singleton:** sempre um único registro com `id = 'singleton'`.
- **`_meta` é singleton de sistema:** sempre um único registro com `id = 'meta'`.
- **Nenhum store de dados de usuário cruza profiles.** Filtragem por `profileId` é obrigatória via índice. `profiles`, `appSettings`, `_meta` e `backupMetadata` são exceções (escopo global).

---

# 2. KeyPaths

KeyPath é a propriedade do objeto que serve como chave primária do store.

## 2.1 Tabela de keyPaths

| Store | keyPath | Formato do valor | Exemplo |
|---|---|---|---|
| `_meta` | `id` | string fixa | `meta` |
| `profiles` | `profileId` | string com prefixo | `profile_01HQ4...` |
| `appSettings` | `id` | string fixa | `singleton` |
| `backupMetadata` | `backupId` | string com prefixo | `backup_01HQ5...` |
| `areas` | `areaId` | string com prefixo | `area_01HQ6...` |
| `temas` | `temaId` | string com prefixo | `tema_01HQ7...` |
| `cards` | `cardId` | string com prefixo | `card_01HQ8...` |
| `cardReviews` | `cardReviewId` | string com prefixo | `cardrev_01HQ9...` |
| `sessions` | `sessionId` | string com prefixo | `session_01HQA...` |
| `agendaItems` | `agendaItemId` | string com prefixo | `agenda_01HQB...` |
| `captures` | `captureId` | string com prefixo | `capt_01HQC...` |

## 2.2 Regras de geração de IDs

- **Geração no cliente** no momento da criação. Sem dependência de servidor.
- **Imutáveis após criação.** Trava do projeto. **[FATO]**
- **Recomendação de formato:** ULID (Universally Unique Lexicographically Sortable Identifier) com prefixo da entidade. Razão: ULID já carrega timestamp ordenável, o que ajuda em listagens cronológicas mesmo sem índice em `createdAt`. **[APOSTA — UUID v4 também serve, mas perde a ordenação intrínseca.]**
- **Prefixos não fazem parte da unicidade**, são auxiliares de leitura humana e debug. A unicidade vem do componente aleatório/temporal do ID.

## 2.3 Por que prefixos no ID

- Facilita debug em logs e backups exportados (você lê `card_01HQ8...` e sabe o tipo na hora).
- Reduz risco de copiar ID de uma entidade e colar em outra acidentalmente em código.
- Custo zero em armazenamento e performance (bytes a mais desprezíveis).

## 2.4 IDs especiais

- **`_meta.id = 'meta'`** — singleton fixo, não aleatório.
- **`appSettings.id = 'singleton'`** — singleton fixo, não aleatório.

Esses dois são exceções intencionais, justificadas pela natureza singleton do store.

---

# 3. Índices secundários

Índices secundários permitem queries eficientes por campos que não são o keyPath. São essenciais para filtragem por `profileId`, queries por data, e busca por campos de status.

## 3.1 Princípio mestre

**Todo store de dados de usuário tem índice em `profileId`.** Sem isso, isolamento de perfil exige varredura completa, o que é inviável.

## 3.2 Tabela de índices por store

### `_meta`
Singleton. Sem índices.

### `profiles`
| Índice | Campo(s) | Único? | Uso |
|---|---|---|---|
| `by_archivedAt` | `archivedAt` | não | listar perfis ativos vs. arquivados |
| `by_name` | `name` | não | busca por nome (futuro) |

### `appSettings`
Singleton. Sem índices.

### `backupMetadata`
| Índice | Campo(s) | Único? | Uso |
|---|---|---|---|
| `by_createdAt` | `createdAt` | não | listar backups em ordem cronológica |

### `areas`
| Índice | Campo(s) | Único? | Uso |
|---|---|---|---|
| `by_profileId` | `profileId` | não | filtrar áreas por perfil ativo |
| `by_profile_archived` | `[profileId, archivedAt]` | não | listar áreas ativas/arquivadas de um perfil |
| `by_profile_order` | `[profileId, order]` | não | listar ordenado |
| `by_profile_nameNormalized` | `[profileId, nameNormalized]` | **sim (parcial)** | enforce unicidade de nome por perfil (§9.2) |

**Nota sobre o índice único de nome:** IndexedDB não suporta unicidade condicional nativa (não dá pra dizer "único só quando `archivedAt` é null"). A solução é usar um campo derivado `nameNormalized` que vale `null` quando a Area está arquivada (entradas com chave `null` em índice único são permitidas em qualquer quantidade pelo IndexedDB). Quando ativa, `nameNormalized` recebe a versão normalizada (lowercase, trim) do nome. Isso enforça unicidade entre Areas ativas e libera reuso de nome após arquivamento. **[APOSTA — solução padrão para unicidade condicional em IndexedDB]**.

### `temas`
| Índice | Campo(s) | Único? | Uso |
|---|---|---|---|
| `by_profileId` | `profileId` | não | base de qualquer query |
| `by_profile_area` | `[profileId, areaId]` | não | filtrar por área |
| `by_profile_status` | `[profileId, status]` | não | filtrar por status |
| `by_profile_archived` | `[profileId, archivedAt]` | não | ativos vs. arquivados |

### `cards`
| Índice | Campo(s) | Único? | Uso |
|---|---|---|---|
| `by_profileId` | `profileId` | não | base |
| `by_temaId` | `temaId` | não | listar cards de um tema |
| `by_profile_temaId` | `[profileId, temaId]` | não | composto, mais seletivo |
| `by_profile_nextReviewDate` | `[profileId, nextReviewDate]` | não | **crítico** — agenda virtual de cards vencendo |
| `by_profile_archived` | `[profileId, archivedAt]` | não | ativos vs. arquivados |

### `cardReviews`
| Índice | Campo(s) | Único? | Uso |
|---|---|---|---|
| `by_profileId` | `profileId` | não | base |
| `by_cardId` | `cardId` | não | histórico de um card específico |
| `by_profile_reviewedAt` | `[profileId, reviewedAt]` | não | listagem cronológica |
| `by_profile_temaId` | `[profileId, temaId]` | não | métricas por tema (campo denormalizado) |
| `by_sessionId` | `sessionId` | não | reviews de uma sessão de revisão específica |

### `sessions`
| Índice | Campo(s) | Único? | Uso |
|---|---|---|---|
| `by_profileId` | `profileId` | não | base |
| `by_profile_date` | `[profileId, date]` | não | listagem cronológica |
| `by_profile_temaId` | `[profileId, temaId]` | não | sessões de um tema |
| `by_profile_type` | `[profileId, type]` | não | filtrar `study` vs `review` |
| `by_pendingAssociation` | `[profileId, pendingAssociation]` | não | listar Sessões Livres pendentes |
| `by_profile_archived` | `[profileId, archivedAt]` | não | filtrar sessões revertidas/ativas |

### `agendaItems`
| Índice | Campo(s) | Único? | Uso |
|---|---|---|---|
| `by_profileId` | `profileId` | não | base |
| `by_profile_scheduledDate` | `[profileId, scheduledDate]` | não | **crítico** — Agenda do dia |
| `by_profile_status` | `[profileId, status]` | não | pendentes vs. concluídos |
| `by_profile_type` | `[profileId, type]` | não | filtrar tipos |
| `by_targetId` | `targetId` | não | descobrir se um card/tema tem agenda materializada |

### `captures`
| Índice | Campo(s) | Único? | Uso |
|---|---|---|---|
| `by_profileId` | `profileId` | não | base |
| `by_profile_status` | `[profileId, status]` | não | inbox (pending) vs. histórico (converted/archived) |
| `by_profile_createdAt` | `[profileId, createdAt]` | não | ordenação cronológica |

## 3.3 Justificativa dos índices compostos

Índices compostos `[profileId, X]` existem porque toda query de dados de usuário começa filtrando pelo perfil ativo, e na sequência precisa filtrar por outro critério (data, status, tipo). Um índice simples em `profileId` resolve a primeira parte mas exige varredura para a segunda. O composto resolve as duas em uma operação.

**Custo:** índices ocupam espaço e desaceleram escritas. Mas em IndexedDB no iPhone, leitura é o gargalo (Agenda do dia precisa ser instantânea). Vale o investimento.

## 3.4 Índice crítico — Agenda virtual

O índice **`cards.by_profile_nextReviewDate`** é o mais importante operacionalmente. Toda vez que o usuário abre o Hub Diário, o sistema executa uma query com range em `nextReviewDate <= hoje` para descobrir cards vencendo. Sem esse índice, a Agenda virtual fica inviável em qualquer volume de cards. **[FATO — consequência direta da decisão "Agenda virtual + acumula atrasados".]**

---

# 4. Relações entre stores

IndexedDB não tem foreign keys. Relações são mantidas por convenção e validadas em camada de aplicação. Esta seção define **quais relações existem e o que significa cada uma**, para que a camada de aplicação saiba o que validar.

## 4.1 Diagrama de relações (Fase 1)

```
┌─────────────┐
│  profiles   │
└──────┬──────┘
       │ 1:N (todas as entidades de dados de usuário)
       │
       ├──────────────────────────────────────────────────┐
       │                                                  │
       ▼                                                  ▼
┌─────────────┐                                    ┌─────────────┐
│   areas     │                                    │   temas     │
└──────┬──────┘                                    └──────┬──────┘
       │ 1:N                                              │
       └──────────────────────────────────────────────────┤
                                                          │
                          ┌───────────────────────────────┼───────────────────────────────┐
                          │                               │                               │
                          ▼                               ▼                               ▼
                   ┌─────────────┐                ┌─────────────┐                ┌─────────────┐
                   │   cards     │                │  sessions   │◄──── opcional (Sessão Livre)
                   └──────┬──────┘                └──────┬──────┘
                          │ 1:N                          │ 1:N (quando type=review)
                          ▼                              │
                   ┌─────────────┐                       │
                   │ cardReviews │◄──────────────────────┘
                   └─────────────┘
                   (também referencia temaId denormalizado e sessionId opcional)


┌─────────────┐                              ┌─────────────┐
│ agendaItems │ ──── targetType + targetId ──┤ cards/temas │
│             │                              │ ou nenhum   │
└─────────────┘                              └─────────────┘


┌─────────────┐
│  captures   │  (sem vínculo até ser convertida)
└─────────────┘
```

## 4.2 Tabela formal de relações

| Origem | Campo | Destino | Cardinalidade | Obrigatório? | Comportamento em delete do destino |
|---|---|---|---|---|---|
| `areas.profileId` | profileId | `profiles.profileId` | N:1 | sim | impedir delete se há áreas |
| `temas.profileId` | profileId | `profiles.profileId` | N:1 | sim | impedir delete se há temas |
| `temas.areaId` | areaId | `areas.areaId` | N:1 | **sim** (regra: Área "Geral" automática garante existência) | impedir delete se há temas |
| `cards.profileId` | profileId | `profiles.profileId` | N:1 | sim | impedir |
| `cards.temaId` | temaId | `temas.temaId` | N:1 | sim | impedir delete; arquivar tema suspende cards |
| `cardReviews.profileId` | profileId | `profiles.profileId` | N:1 | sim | impedir |
| `cardReviews.cardId` | cardId | `cards.cardId` | N:1 | sim | impedir delete do card |
| `cardReviews.temaId` | temaId | `temas.temaId` | N:1 | sim (denormalizado) | snapshot histórico, não atualiza se card mudar de tema |
| `cardReviews.sessionId` | sessionId | `sessions.sessionId` | N:1 | não (opcional) | impedir delete da sessão se tem reviews |
| `sessions.profileId` | profileId | `profiles.profileId` | N:1 | sim | impedir |
| `sessions.temaId` | temaId | `temas.temaId` | N:1 | **não** (Sessão Livre permitida) | impedir delete se há sessões |
| `agendaItems.profileId` | profileId | `profiles.profileId` | N:1 | sim | impedir |
| `agendaItems.targetId` | (polimórfico) | `cards.cardId` ou `temas.temaId` | N:1 | depende de `targetType` | cancelar agenda se target arquivado |
| `agendaItems.manualLinkedTemaId` | temaId | `temas.temaId` | N:1 | não | desvincular |
| `captures.profileId` | profileId | `profiles.profileId` | N:1 | sim | impedir |

## 4.3 Regras especiais sobre `cardReviews.temaId` (denormalizado)

Trava do Mapa de Domínio: `cardReviews` carrega `temaId` denormalizado para queries rápidas de "tempo total de revisão por tema". **[FATO]**

**Comportamento em mudança de tema do card:**
Quando um Card é movido de Tema A para Tema B, **os CardReviews antigos NÃO são atualizados.** Eles permanecem apontando para Tema A. Isso é intencional: a review aconteceu no contexto de Tema A, e historicamente é onde ela pertence.

**Consequência prática:** se você mover Card X de "Manguito" para "Ombro Geral", o histórico de reviews de X continua contando para "Manguito" nas métricas históricas. Reviews futuras já contarão para "Ombro Geral".

Isso preserva a verdade histórica e evita reescrita em massa de eventos imutáveis. **[APOSTA com justificativa forte.]**

## 4.4 Comportamento em soft delete (arquivamento)

Soft delete (campo `archivedAt`) é o padrão. Hard delete só é permitido quando zero referências.

**Tema arquivado:**
- Cards do tema têm geração de revisões VRVS 3P **suspensa** (não geram items na Agenda virtual).
- Sessões do tema continuam existindo e contando para histórico geral.
- AgendaItems pendentes referenciando o tema são **cancelados** (status `skipped` ou removidos, decisão na §7).
- Tema some de listas ativas, mas continua referenciável.

**Card arquivado:**
- Não gera mais revisões VRVS 3P.
- AgendaItems pendentes referenciando o card são cancelados.
- CardReviews permanecem (histórico).

**Area arquivada:** [DECIDIDO]
- Arquivar Area **NÃO arquiva Temas automaticamente.** Sem cascata.
- Temas da Area continuam ativos e funcionais (geram revisões, aparecem na Agenda, contam métricas).
- A Area aparece marcada como arquivada nos filtros de listagem de Temas.
- O usuário pode mover Temas para outra Area quando quiser, manualmente.
- Justificativa: Area é taxonomia auxiliar; arquivar Area é gesto organizacional (limpar a lista de filtros), não declaração sobre o conteúdo dos Temas.

**Profile arquivado:**
- Não pode ser o `activeProfileId`.
- Some da lista de profiles para troca.
- Dados continuam intactos (recuperável).

## 4.5 Cascatas proibidas

Para preservar histórico e evitar perda silenciosa, **nenhuma operação dispara cascata de hard delete**. Toda eliminação em cascata é soft (arquivamento).

A única exceção: AgendaItems pendentes são realmente removidos (não arquivados) quando o target é arquivado, porque AgendaItem pendente não tem valor histórico — é uma intenção futura que perdeu sentido. **[APOSTA]**

---

# 5. schemaVersion

IndexedDB exige versionamento explícito do schema. Toda alteração estrutural (criar/remover store, criar/remover índice) incrementa a versão e dispara `onupgradeneeded`.

## 5.1 Numeração

Versão é inteiro positivo, monotônico. Sem semver. IndexedDB não suporta.

| Versão | Conteúdo |
|---|---|
| `1` | Schema inicial Fase 1 (11 stores listados em §1.1). |
| `2` | (a definir) Provavelmente: adição de `notes` (entidade Note como própria). |
| `3` | (a definir) Provavelmente: adição de `reminders` se decidirmos criar. |

**Estratégia geral:** uma versão por mudança estrutural significativa. Não agrupar muitas mudanças em uma versão só, porque dificulta debug se algo falhar.

## 5.2 Onde a versão vive

- **Versão do banco IndexedDB:** definida na chamada `indexedDB.open(name, version)`.
- **Versão registrada em `_meta.schemaVersion`:** redundância intencional. Permite que, ao abrir o banco, o app valide se a versão registrada bate com a versão esperada pelo código atual.

**Por que redundância:** se algo der errado durante migração e o app reiniciar no meio, podemos detectar inconsistência comparando o que o IndexedDB acha que é vs. o que `_meta` registra.

## 5.3 Versão do app vs. versão do schema

São independentes. App pode ter v3.4.7 enquanto o schema do banco está na v1. Mudança de versão do app só implica mudança de schema se houver alteração estrutural de stores/índices.

`_meta` registra ambos: `schemaVersion` (do banco) e `appVersion` (snapshot da versão do app que abriu o banco pela última vez).

---

# 6. Estratégia de migração entre versões

Migração em IndexedDB acontece dentro do callback `onupgradeneeded`, que é chamado quando o banco é aberto com versão maior que a atual.

## 6.1 Princípios

1. **Migração é determinística.** Dado banco em versão N, migrar para N+1 sempre produz o mesmo resultado.
2. **Migração é incremental.** Para ir de v1 para v3, executar migração v1→v2 e depois v2→v3. Nunca migração direta v1→v3.
3. **Migração é resiliente.** Se algo falhar no meio, o banco deve ficar em estado coerente — preferencialmente revertendo, ou no mínimo registrando o ponto de falha em `_meta`.
4. **Backup antes de migrar.** Antes de qualquer migração que altere dados existentes (não só estrutura), o app **deve oferecer backup** ao usuário e **deve registrar o backup** em `backupMetadata` com flag de "pré-migração".

## 6.2 Tipos de migração

### Tipo A — Estrutural pura (criar store/índice)

Adicionar novo store ou índice. Não toca dados existentes.

**Exemplo:** v1 → v2 adiciona store `notes`.

**Risco:** baixo. Migração é rápida e atômica.

**Backup obrigatório?** Não, mas registrar timestamp da migração em `_meta.migrations[]` para histórico.

### Tipo B — Estrutural com dados (transformar entidades existentes)

Alterar formato de campos, denormalizar/desnormalizar, dividir entidade em duas.

**Exemplo hipotético:** v3 → v4 separa `Tema.notes` (string) em entidades `notes` (Note como entidade própria, retroativamente).

**Risco:** alto. Manipula dados do usuário.

**Backup obrigatório?** **Sim.** Antes da migração, gerar backup automático e registrar em `backupMetadata` com flag `preMigration: true`. Se migração falhar, oferecer restore.

### Tipo C — Apenas índices

Adicionar/remover índice em store existente.

**Risco:** baixo. Apenas reindexação interna.

**Backup obrigatório?** Não.

## 6.3 Registro de migrações em `_meta`

`_meta` mantém um array `migrations[]` com histórico de migrações aplicadas:

```
{
  fromVersion: 1,
  toVersion: 2,
  startedAt: "2026-XX-XXT...",
  finishedAt: "2026-XX-XXT...",
  status: "success" | "failed" | "rolled_back",
  backupId: "backup_..." | null
}
```

Histórico de migrações é útil para debug em uso longitudinal (anos depois, descobrir quando foi introduzida tal estrutura).

## 6.4 Falha em migração — comportamento

Se `onupgradeneeded` lança exceção:
- IndexedDB aborta a transação automaticamente. Banco volta à versão anterior.
- App detecta isso na próxima abertura e mostra erro claro ao usuário.
- App oferece restore do backup pré-migração, se existir.
- App **NÃO tenta migração novamente automaticamente**. Aguarda ação explícita do usuário (clicar em "tentar novamente" ou em "restore").

**[APOSTA]** Tentativa automática de re-migração pode mascarar bug e corromper dados. Melhor exigir intervenção consciente.

## 6.5 Migração e isolamento de perfil

Migrações são globais ao banco, não por perfil. Mudança estrutural afeta todos os perfis simultaneamente.

**Consequência:** se uma migração transforma dados de um perfil específico, ela percorre todos os perfis no mesmo `onupgradeneeded`.

---

# 7. Regras de integridade

Regras que o banco (e a camada de aplicação que escreve nele) deve respeitar. Algumas são enforced por estrutura (índices únicos), outras por convenção que a camada de aplicação valida.

## 7.1 Integridade estrutural

**R1 — Singleton stores têm exatamente um registro.**
- `_meta` sempre tem um registro com `id = 'meta'`.
- `appSettings` sempre tem um registro com `id = 'singleton'`.
- Toda escrita em singleton é `put` (upsert), nunca `add`.

**R2 — IDs são imutáveis após criação.**
- Camada de aplicação nunca altera campo de keyPath de um registro existente.
- Operação de "renomear" altera campos de display, nunca o ID.

**R3 — Toda entidade de dados de usuário tem `profileId` válido.**
- Validado pela camada de aplicação no momento da escrita.
- Não há query de dados de usuário sem filtro por `profileId`.

**R4 — `createdAt` e `updatedAt` em toda entidade.**
- `createdAt` definido na criação, nunca alterado.
- `updatedAt` atualizado a cada modificação.
- Formato: ISO 8601 UTC.

## 7.2 Integridade referencial

**R5 — Foreign keys validadas em escrita.**
- Antes de gravar entidade com referência (ex.: Card com `temaId`), camada de aplicação verifica que o referenciado existe.
- Não confiar em dados externos (importação de backup, por exemplo) — re-validar.

**R6 — Soft delete em cascata para invisibilidade.**
- Tema arquivado → Cards do tema deixam de gerar revisões.
- Card arquivado → AgendaItems pendentes do card são cancelados.
- Profile arquivado → todas as entidades do profile somem das listas ativas.

**R7 — Hard delete proibido com referências.**
- Camada de aplicação verifica zero referências antes de hard delete.
- Em caso de tentativa, falha explícita (não silenciosa).

## 7.3 Integridade de domínio

**R8 — Sessão tipo `review` exige `temaId`.**
- Validado em escrita. Sessão livre só permitida com tipo `study`.

**R9 — Card tem `temaId` obrigatório.**
- Validado em escrita. Card órfão é proibido (decisão consensuada).

**R10 — CardReview é imutável.**
- Após `add`, nunca é atualizado. Correção se faz com novo CardReview.

**R11 — Estado VRVS 3P do Card é reconstruível.**
- Função `recomputeCardState(cardId)` em camada de aplicação percorre CardReviews e devolve estado equivalente ao persistido.
- Invariante: estado persistido === resultado de `recomputeCardState`. Divergência = bug.
- Toda atualização de estado passa por uma função única (`recordReview`) que escreve Card + CardReview em transação atômica.

**R12 — Toda escrita em cardReviews acompanha update de cards.**
- Transação atômica: `add` em cardReviews + `put` em cards.
- Se uma falha, ambas falham (transação IndexedDB cuida disso, desde que estejam na mesma transação).

**R13 — Captures não alimentam métricas.**
- Não há query de "métricas de tema" que considere `captures`.
- Capture só vira ativa quando convertida em outra entidade.

## 7.4 Integridade temporal

**R14 — `updatedAt >= createdAt`.**

**R15 — `cardReview.reviewedAt` no passado ou presente.**
- Reviews com timestamp futuro são erro.

**R16 — `session.date` no passado ou presente.**
- Sessões agendadas para o futuro vivem em `agendaItems`, não em `sessions`.

## 7.5 Integridade de transações críticas

Para operações que envolvem múltiplas escritas correlacionadas, **todas devem viver em uma única transação IndexedDB** com mode `readwrite`.

Operações críticas:

| Operação | Stores envolvidos |
|---|---|
| Registrar review de card | `cards` (update estado) + `cardReviews` (add) |
| Concluir AgendaItem `card_review` | `cards` + `cardReviews` + `agendaItems` (update status) |
| Concluir AgendaItem `tema_study` | `sessions` (add) + `agendaItems` (update status) |
| Iniciar review de tema (Sessão `review`) | `sessions` (add) + N × `cardReviews` (add) + N × `cards` (update) + `agendaItems` (update se aplicável) |
| Converter Capture | `captures` (update status) + entidade de destino (add) |
| Arquivar Tema | `temas` (update) + N × `agendaItems` pendentes (cancel) |

**Princípio:** se a operação tem semântica única do ponto de vista do usuário, deve ser transacional. Se duas escritas correlacionadas vivem em transações separadas, há janela onde o estado é inconsistente. Em iPhone (que pode matar o processo a qualquer momento), essa janela é fatal.

---

# 8. Persistido vs. derivado

Reafirmando o princípio do Mapa de Domínio: **um fato vive em um lugar só**. Métricas e agregações são calculadas, não persistidas.

## 8.1 Tabela consolidada

| Categoria | Persistido (em IndexedDB) | Derivado (calculado em runtime) |
|---|---|---|
| Profile | tudo | — |
| Area | tudo | contagem de Temas (cálculo de UI) |
| Tema | id, name, areaId, priority, status, difficulty, notes, recurrenceConfig, tags, datas | rendimento médio, tempo total estudado, contagem de sessões, último estudo, próxima revisão sugerida, contagem de cards, cards vencendo, "saúde" |
| Card | id, temaId, conteúdo, estado VRVS 3P (cache), datas | total de reviews, taxa de sucesso, dias até vencer |
| CardReview | tudo (imutável) | — |
| Sessão | tudo | — |
| AgendaItem | manuais + estados (done/skipped/snoozed); itens materializados | itens pendentes de `card_review` e `tema_study` (calculados em runtime, materializados só ao interagir) |
| Capture | tudo | — |
| AppSettings | tudo | — |
| BackupMetadata | tudo | — |

## 8.2 Caso especial — estado do Card

Estado VRVS 3P do Card (`vrvsStage`, `nextReviewDate`, `currentInterval`, `lastReviewedAt`, `lastResult`) é tecnicamente **cache calculado** dos CardReviews. Mas é **persistido como campo do Card** por razões de performance.

**Verdade absoluta:** vive em `cardReviews`.
**Fonte de leitura:** vive em `cards`.

Invariante R11 garante que ambos estão sincronizados. Toda escrita passa por `recordReview` (camada de aplicação) que mantém a sincronia.

Em caso de bug detectado (estado divergente), a função `recomputeCardState` recalcula a partir dos eventos e corrige o cache.

## 8.3 Caso especial — Agenda

A Agenda do dia atual é **derivada** dos seguintes dados:

- **Cards vencendo:** query em `cards` com filtro `nextReviewDate <= hoje AND archivedAt IS NULL AND temaId aponta para Tema não arquivado`.
- **Temas vencendo:** query em `temas` com lógica de `recurrenceConfig` aplicada sobre data da última sessão.
- **AgendaItems materializados:** query em `agendaItems` com `scheduledDate <= hoje AND status = pending`.

A camada de aplicação une essas três fontes em runtime. AgendaItem só é persistido quando o usuário interage (adia, pula, completa, ou cria manual). **[FATO — decisão "virtual + materializa ao interagir + acumula atrasados".]**

## 8.4 Princípio de validação

Para cada campo persistido, validar: **este campo é fato bruto ou pode ser derivado de outros fatos?** Se pode ser derivado, persistir é erro arquitetural (exceto cache justificado, como o do Card).

---

# 9. Contratos básicos de leitura/escrita

A camada de aplicação acessa o IndexedDB através de funções de domínio bem definidas, não através de chamadas raw. Esta seção descreve os contratos esperados.

**Importante:** este documento NÃO especifica assinaturas de funções (não é código). Apenas descreve **quais operações o domínio expõe** e **quais regras elas garantem**.

## 9.1 Operações de profile

- **Criar profile:** valida nome, gera ID, escreve em `profiles`. Se for primeiro profile criado, atualiza `appSettings.activeProfileId`.
- **Trocar profile ativo:** atualiza `appSettings.activeProfileId`. Não toca dados de profiles em si.
- **Arquivar profile:** define `archivedAt`. Recusa se for o `activeProfileId` (exige troca antes).
- **Listar profiles:** retorna profiles ativos por default. Filtro opcional para incluir arquivados.

## 9.2 Operações de área

- **Criar área:** dentro do `activeProfileId`. **Nome deve ser único por perfil** (validado em escrita). Tentativa de criar Area com nome duplicado dentro do mesmo `profileId` é recusada com erro claro. **[DECIDIDO]**
  - Justificativa: evita confusão de UI (duas Areas "Geral" no mesmo perfil é bug de produto, não feature).
  - Comparação é case-insensitive e ignora espaços nas extremidades (`"Ombro"` e `"ombro "` colidem).
  - Validação aplica apenas a Areas **não-arquivadas**. Area arquivada não bloqueia criação de nova com mesmo nome.
- **Renomear área:** atualiza `name`, mantém `areaId`. Validação de unicidade aplica também em rename.
- **Arquivar área:** define `archivedAt`. **Não cascateia em Temas** (§4.4).

## 9.3 Operações de tema

- **Criar tema:** valida `areaId` existe (ou usa "Geral" default), gera ID, escreve.
- **Editar tema:** atualiza campos de display, mantém `temaId`.
- **Mudar área do tema:** atualiza `areaId`. Permitido livremente.
- **Arquivar tema:** define `archivedAt`, dispara cancelamento de AgendaItems pendentes do tema e seus cards (transação composta).
- **Listar temas:** ativos por default. Filtros: por área, por status, por prioridade.
- **Métricas do tema:** função pura sobre Sessions e CardReviews. Nunca cacheadas no Tema.

## 9.4 Operações de card

- **Criar card:** exige `temaId` válido. Estado VRVS 3P inicializado (próxima revisão hoje, intervalo zero, etc.). Em transação única.
- **Editar conteúdo do card:** atualiza `front`/`back`. Não afeta estado VRVS 3P.
- **Mover card de tema:** atualiza `temaId`, NÃO mexe em CardReviews históricos (regra R em §4.3).
- **Arquivar card:** define `archivedAt`, cancela AgendaItems pendentes.
- **Recordar review (operação crítica):** função única `recordReview(cardId, result, sessionId?)`. Em transação atômica:
  - Calcula novo estado VRVS 3P.
  - `add` em `cardReviews` com snapshot before/after.
  - `put` em `cards` com novo estado.
  - Se vinculado a Sessão de revisão, vincula via `sessionId`.

## 9.5 Operações de sessão

- **Criar sessão `study`:** com ou sem `temaId`. Se sem, marca `pendingAssociation = true`.
- **Criar sessão `review`:** exige `temaId`, normalmente criada automaticamente ao iniciar revisão de cards de um tema. Pode conter múltiplos CardReviews vinculados.
- **Editar sessão:** campos editáveis: `date`, `notes`, `temaId`, `perceivedPerformance`, `durationMinutes`. Campo `type` NÃO editável.
- **Reverter sessão:** **soft delete** — define `archivedAt` com timestamp da reversão. **[DECIDIDO]**
  - Sessão revertida some de listagens ativas e **não conta** para métricas derivadas de Tema (rendimento médio, tempo total, contagem de sessões).
  - Permanece no banco para rastreabilidade.
  - Reverter sessão tipo `review` **não reverte** os CardReviews vinculados (CardReview é imutável, R10). A `sessionId` em CardReviews permanece, mas a sessão arquivada deixa de aparecer em listagens.
  - Operação é reversível: "desarquivar sessão" remove `archivedAt` e ela volta a contar.
  - Hard delete de sessão é permitido apenas via operação administrativa explícita (limpeza de histórico), nunca como fluxo padrão.
- **Associar sessão livre a tema:** atualiza `temaId`, define `pendingAssociation = false`.

## 9.6 Operações de Agenda

- **Listar Agenda do dia:** une fontes virtuais e materializadas (ver §8.3).
- **Materializar AgendaItem:** quando usuário interage com item virtual (adia/pula/conclui), criar `agendaItem` persistido com estado.
- **Concluir AgendaItem `card_review`:** transação composta com `recordReview`.
- **Concluir AgendaItem `tema_study`:** abre fluxo de criação de Sessão; ao salvar Sessão, marca AgendaItem como `done` em transação.
- **Adiar (snooze):** atualiza `snoozedUntil` e `status`.
- **Pular (skip):** marca `skipped`. Não gera Sessão.
- **Criar AgendaItem manual:** livre. Pode ou não vincular a Tema via `manualLinkedTemaId`.

## 9.7 Operações de Capture

- **Criar capture:** texto + timestamp. Único campo obrigatório.
- **Listar inbox:** captures com `status = pending`.
- **Converter capture:** transação composta — cria entidade de destino e atualiza capture com `status = converted` e `convertedTo`. **[FATO — versão mínima Fase 1, sem split, sem undo.]**
- **Arquivar capture:** define `status = archived`.

## 9.8 Operações de backup

### Geração de backup

- **Backup global:** lê todos os profiles e todas as suas entidades, serializa em JSON único, escreve metadata em `backupMetadata` com `type = 'full'`. **[FASE 1]**
- **Backup por perfil:** lê apenas as entidades vinculadas a um `profileId` específico (geralmente o `activeProfileId`), serializa em JSON, escreve metadata com `type = 'profile_only'` e `scope.profileIds = [profileId]`. **[FASE 1 — DECIDIDO]**
- **Saída do arquivo:** arquivo JSON exportado pelo sistema do iPhone (Share Sheet / Files). NÃO fica no IndexedDB. Apenas a metadata persiste.
- **Conteúdo da metadata:** `backupId`, `createdAt`, `type`, `scope`, `entityCounts`, `appVersion`, `schemaVersion`, `format`, `notes` (opcional).

### Listagem

- **Listar backups:** lê `backupMetadata` ordenado por `createdAt` descendente.

### Restauração

Estratégia da Fase 1 prioriza **segurança e reversibilidade**. Não há fluxo destrutivo silencioso. **[DECIDIDO]**

**Estratégias disponíveis na Fase 1:**

1. **Restaurar como novo profile (estratégia padrão e recomendada).**
   - O conteúdo do backup é importado como um **novo profile** com `profileId` recém-gerado.
   - Profile existente NÃO é tocado.
   - O usuário ganha um perfil adicional, podendo comparar dados ou descartar o original depois.
   - Esta é a opção apresentada por padrão na UI.

2. **Substituir profile existente (estratégia destrutiva, com confirmação forte).**
   - Substitui completamente os dados de um profile específico pelos do backup.
   - **Exige dupla confirmação**: o usuário precisa selecionar o profile alvo, ler aviso explícito sobre perda de dados, e confirmar com ação adicional (ex.: digitar nome do profile, ou tocar em "Sim, substituir" após delay).
   - **Backup automático pré-substituição:** antes de aplicar, o sistema gera backup do estado atual do profile alvo e registra em `backupMetadata` com `notes = 'pre_restore_substitution'`. Isso garante recuperação se o restore for um erro.
   - Operação é transacional dentro do escopo do profile substituído.

**Estratégia adiada para Fase 2:**

3. **Mesclar dados (merge).** Combinar entidades do backup com as do profile existente, resolvendo conflitos por timestamp ou regras de domínio. **Não entra na Fase 1** — operação complexa, com muitos cenários de conflito (mesmo `temaId` em estados diferentes? Sessões duplicadas? CardReviews já registradas?). Resolver mal pode corromper dados. Fica para Fase 2 com modelagem dedicada.

### Validação na restauração

Antes de aplicar qualquer estratégia, o sistema valida o arquivo JSON:

- **`schemaVersion` compatível.** Se backup é de versão maior que a atual do app, recusar com mensagem clara ("backup criado em versão mais nova"). Se é de versão menor, aplicar migrações em memória antes de importar.
- **Integridade estrutural.** Todos os IDs presentes; referências internas batem (cards apontam para temas existentes no backup; etc.).
- **Pertencimento de profile.** Em backup tipo `profile_only`, todas as entidades têm o mesmo `profileId`. Em backup global, todas as entidades têm `profileId` válido apontando para um Profile presente no próprio backup.

Falha de validação aborta a operação e exibe erro descritivo. Não tenta importar parcialmente.

## 9.9 Princípios gerais dos contratos

1. **Toda operação que envolve múltiplas entidades correlatas é transacional.** §7.5.
2. **Toda escrita crítica passa por releitura de confirmação** antes de informar sucesso ao usuário (ver §11).
3. **Validação acontece antes de escrita.** Não aceitar dados inválidos para depois detectar.
4. **Cache de domínio em memória é OK** para a sessão do app (ex.: cache de Tema ativo). Cache em IndexedDB de coisas que são derivadas é proibido.
5. **Erros propagam.** Operação que falha lança exceção tratável pela UI. Falha silenciosa é proibida.

---

# 10. Faseamento (Fase 1 / Fase 2)

## 10.1 Fase 1 — fundação

Schema versão 1. Inclui:

- 11 stores listados em §1.1.
- Todos os índices listados em §3 para esses stores.
- Todas as regras de integridade em §7.
- Operações de §9.1 a §9.9 em versão completa para os stores existentes, exceto exceções listadas abaixo.

**Exceções (versões mínimas na Fase 1):**

- **Capture:** sem split (uma capture vira no máximo uma entidade), sem undo de conversão. **[FATO]**
- **Sessão Livre:** permitida, mas adoção retroativa é apenas edição manual do `temaId`. Sem sugestão automática nem fluxo guiado. **[FATO]**
- **Backup:** manual apenas (sem automático periódico). Modos `full` e `profile_only` disponíveis. Restauração com duas estratégias: criar novo profile (padrão) ou substituir profile com confirmação forte. Sem merge. **[DECIDIDO — ver §9.8]**
- **`recurrenceConfig` de Tema:** versão mínima — uma única regra de recorrência por tema, sem perfis múltiplos de recorrência. **[APOSTA]**

## 10.2 Fase 2 — refinamento

Schema versão 2 (e seguintes). Adições previstas:

- Store `notes` (Note como entidade própria).
- Possivelmente store `reminders` (se confirmado que faz sentido).
- Capture: split, undo de conversão, sugestão inteligente automática.
- Sessão Livre: adoção retroativa assistida (sugestão de Tema baseada em conteúdo).
- AgendaItem: ações em lote (concluir múltiplos, redistribuir atrasados).
- Backup: automático periódico, backups parciais por escopo.
- Política de retenção de CardReviews antigos (só se necessário — ver §11.6).
- `recurrenceConfig` avançado (múltiplas regras, exceções, granularidades).

## 10.3 Fase 3 — sofisticação (não detalhada aqui)

Estatísticas avançadas, configuração do VRVS 3P pelo usuário, exportações seletivas, relatórios. Nenhuma dessas previsto exige schema novo agora — apenas leitura/derivação sobre dados existentes.

---

# 11. Comportamento defensivo no Safari iOS / PWA

Esta seção trata o IndexedDB como **armazenamento real, com riscos reais**. Define decisões arquiteturais que reduzem chance de perda silenciosa de dados em uso longitudinal (anos).

## 11.1 Store `_meta` — sentinela do banco

Store singleton com um único registro (`id = 'meta'`). Campos:

| Campo | Conteúdo |
|---|---|
| `id` | `'meta'` (fixo) |
| `schemaVersion` | versão do schema atual (ex.: `1`) |
| `installationId` | ID único gerado na primeira instalação (nunca muda) |
| `createdAt` | timestamp da primeira inicialização do banco |
| `lastOpenedAt` | timestamp da última abertura do app |
| `appVersion` | versão do app que abriu por último |
| `storagePersistedStatus` | `'granted'` \| `'denied'` \| `'unsupported'` \| `'unknown'` |
| `lastBackupKnownAt` | timestamp do último backup registrado em `backupMetadata` |
| `migrations` | array de registros de migrações aplicadas (ver §6.3) |

**Função operacional:** `_meta` é a impressão digital do banco. Se ele existir e estiver coerente, o banco é dele. Se sumir, o banco foi corrompido/limpo.

## 11.2 Detecção no boot

Toda inicialização do app executa, em ordem:

1. **Verificar disponibilidade do IndexedDB.** Se `window.indexedDB` é `undefined` (modo privado extremo, navegador não suportado), entrar em modo somente-leitura ou exibir bloqueio com mensagem clara.

2. **Abrir o banco.** `indexedDB.open(name, expectedVersion)`.
   - Se versão atual < esperada: `onupgradeneeded` dispara migração (§6).
   - Se versão atual > esperada: erro fatal — app está mais antigo que o banco. Recusar abrir, exibir mensagem ("seus dados foram criados em uma versão mais nova do app, atualize").

3. **Ler `_meta`.**
   - **Caso A — primeira execução:** `_meta` não existe. Criar `_meta` com defaults, criar Profile inicial, criar Area "Geral" do Profile, gravar `appSettings` singleton com `activeProfileId` apontando para Profile criado.
   - **Caso B — abertura saudável:** `_meta` existe e coerente. Atualizar `lastOpenedAt` e `appVersion`. Seguir.
   - **Caso C — banco vazio inesperado:** stores existem mas `_meta` sumiu (ou existe mas incoerente — `installationId` diferente, `schemaVersion` divergente). **Possível eviction silenciosa.** Alertar usuário, oferecer restore de backup.
   - **Caso D — IndexedDB falhando:** abertura lança erro inesperado. Logar, mostrar mensagem ao usuário, não tentar gravar nada.

4. **Teste de escrita/leitura.** Antes de liberar uso real do app, executar teste rápido em store de testes (ou usar `_meta` mesmo): escrever um valor de teste, ler, comparar. Se falhar, modo somente-leitura.

## 11.3 Persistent Storage API

**Timing de solicitação: após primeira ação significativa, não no boot. [DECIDIDO]**

A solicitação de `navigator.storage.persist()` acontece **após o usuário realizar a primeira ação significativa**, não imediatamente na abertura do app. Solicitar logo no boot expõe popup do navegador antes de o usuário entender o que é o app, gerando recusa por reflexo e desperdício do prompt (alguns navegadores não pedem de novo após negativa).

**Ações consideradas significativas (qualquer uma dispara a solicitação):**

- Criar primeiro Tema.
- Criar primeiro Card.
- Registrar primeira Sessão.
- Criar primeira Capture e convertê-la em entidade ativa.

A solicitação acontece **uma única vez** após qualquer um desses gatilhos, com base no estado de `_meta.storagePersistedStatus`:

- Se `unknown`, dispara solicitação.
- Se `granted`, `denied`, `unsupported`, não solicita novamente automaticamente. Usuário pode acionar manualmente em "Mais > Armazenamento".

**Chamada:**

```
navigator.storage.persist()
```

**Comportamento esperado:**
- Resposta `true`: armazenamento marcado como persistente. Reduz (não elimina) chance de eviction. Registrar `storagePersistedStatus = 'granted'` em `_meta`.
- Resposta `false`: navegador negou. Registrar `'denied'`. Não impede uso, mas usuário deve ser avisado periodicamente da importância de backup manual.
- API indisponível (Safari muito antigo): registrar `'unsupported'`.

**Importante:** persistência concedida NÃO garante imunidade. O iOS pode ainda apagar dados em pressão extrema de armazenamento. Persistência é "best effort" — reforçar isso na UI.

## 11.4 Confirmação de escrita crítica (releitura)

Operações cuja perda silenciosa é inaceitável devem ser confirmadas por **releitura do dado escrito** antes de devolver "salvo" para a UI.

**Lista de operações com releitura obrigatória:**

| Operação | Releitura |
|---|---|
| Criar/atualizar Sessão | ler de volta a sessão por ID |
| Criar CardReview e atualizar Card | ler de volta o Card e verificar se `lastReviewedAt` bate |
| Concluir/adiar/pular AgendaItem | ler de volta o status |
| Gerar backup | confirmar que `backupMetadata` foi gravado |
| Migração estrutural | comparar `_meta.schemaVersion` antes de finalizar |

**Implementação conceitual:** após `transaction.oncomplete`, executar uma transação `readonly` que lê o registro escrito e valida campos-chave. Se mismatch, lançar erro e alertar usuário.

**Custo:** uma leitura adicional por operação crítica. Em iPhone, custo desprezível. Ganho de robustez: alto.

## 11.5 Backup como mecanismo de sobrevivência

**Backup deixa de ser feature de conveniência. É salvaguarda de primeira linha contra perda local.**

### Fase 1 — backup manual obrigatório

- **Geração:** acionada pelo usuário em "Mais > Backup".
- **Dois modos disponíveis na Fase 1: [DECIDIDO]**
  - **Backup global** (`type = 'full'`): JSON único contendo todos os profiles e suas entidades, mais metadata (`schemaVersion`, `appVersion`, `createdAt`, contagem de entidades). Útil para recuperação completa do dispositivo.
  - **Backup por perfil** (`type = 'profile_only'`): JSON contendo apenas os dados do `activeProfileId` (ou de profile selecionado pelo usuário). Útil para compartilhar entre perfis, transferir entre dispositivos, ou snapshot pontual.
- **Saída:** arquivo baixado pelo sistema do iPhone (Share Sheet / Files), não fica no IndexedDB.
- **Registro:** entrada em `backupMetadata` com `backupId`, timestamp, `type`, `scope`, contagens.
- **Restauração:** estratégias detalhadas em §9.8 (estratégia padrão: criar novo profile a partir do backup; estratégia destrutiva com confirmação forte: substituir profile existente).

### Fase 2 — refinamentos

- Backup automático periódico (semanal? mensal?) com nudge ao usuário para salvar arquivo gerado.
- Lembretes inteligentes ("último backup há 60 dias").
- Backup parcial seletivo (um Tema, um intervalo de datas).

## 11.6 Quota de armazenamento e crescimento

### Fase 1 — preparação, sem ação automática [DECIDIDO]

- **Não apagar CardReviews automaticamente. Em hipótese alguma.** Histórico imutável é fonte de verdade do VRVS 3P. CardReviews permanecem indefinidamente.
- **Não comprimir dados antigos.** Schema preparado para suportar uso longitudinal sem qualquer estratégia de compactação.
- **Sem alertas de quota nesta fase.** Pode ser falso alarme em uso normal e gera ruído desnecessário.

### Fase 2 — monitoramento e política sob demanda

- **`navigator.storage.estimate()`** pode passar a ser chamado periodicamente para diagnóstico.
- **Alerta de quota** quando uso ultrapassar threshold a definir (sugestão inicial: 80%).
- **Discussão de política de retenção** apenas se a quota se mostrar problema real em uso longitudinal observado. Nada é decidido proativamente nesta fase.
- **Possível agregação futura** (decisão de Fase 2, não compromisso): CardReviews muito antigos poderiam ser agregados em registros sumarizados, mantendo counts e médias para reconstrução de métricas. Mas isso é hipótese, não plano.

### Princípio operacional

Em uso longitudinal de 5+ anos com uso ativo, quota pode apertar. Schema da Fase 1 já é compatível com uma futura política de retenção sem mudanças estruturais — basta adicionar campos opcionais de agregação se um dia for necessário. **Mas o compromisso atual é claro: na Fase 1, CardReviews são sagrados e não somem.**

## 11.7 Eviction e perda local

Cenários de risco real:

1. **Pressão de armazenamento do iPhone.** iOS apaga dados de origens menos usadas.
2. **Remoção e reinstalação da PWA da tela inicial.** Comportamento não-determinístico, dependendo da versão do iOS.
3. **Limpeza manual de dados do Safari.** Apaga IndexedDB junto.
4. **Reset do dispositivo / atualização problemática do iOS.**
5. **Falhas raras de storage** (corrupção de banco).

**Postura recomendada:** tratar como risco real, sem alarmismo. PWA instalado é mais estável que uso casual no Safari, mas não imune. Mitigações:

- **Persistent Storage API** solicitada (§11.3).
- **Backup manual** disponível desde dia 1 (§11.5).
- **Detecção de eviction** no boot via `_meta` (§11.2 caso C).
- **UI educa o usuário** sobre importância de backup periódico (sem ser chata).

## 11.8 Evolução futura — portabilidade

O schema deve permitir migração futura para arquiteturas mais robustas (app nativo/híbrido, sync com servidor, backend) sem reescrita do modelo de dados.

Princípios que garantem portabilidade:

- **IDs estáveis e independentes de banco.** ULIDs/UUIDs gerados no cliente, não auto-incrementos.
- **Schema serializável em JSON.** Backup é a forma exportada do schema; deve representar fielmente todas as entidades.
- **`schemaVersion` versionado** facilita conversão entre versões de banco.
- **Entidades separadas, com responsabilidades claras.** Facilita mapear para tabelas SQL ou collections NoSQL no futuro.
- **Contratos de leitura/escrita centralizados** (camada de domínio) facilitam trocar implementação de armazenamento sem reescrever app.

**[FATO — trava do projeto sobre portabilidade.]**

## 11.9 Modo privado / IndexedDB indisponível

Detecção no boot (§11.2 passo 4). Se IndexedDB indisponível ou não-funcional:

- **Modo somente-leitura** com aviso visível. Permite consultar dados se houver, mas bloqueia escritas.
- **Mensagem clara** explicando que o app precisa de storage funcional, pedindo para abrir em Safari normal (não modo privado) ou instalar como PWA.
- **Não corromper estado** sob nenhuma circunstância.

---

# 12. Decisões consolidadas (V2)

Esta seção registra as decisões que estavam marcadas como **[PENDENTE]** na V1.0 e foram fechadas na V2.0 do documento. Todas estão agora aplicadas no corpo do schema.

| # | Tópico | Onde aplicado | Decisão final |
|---|---|---|---|
| 1 | Cascata de Area arquivada | §4.4 | Arquivar Area NÃO arquiva Temas. Temas continuam ativos; Area aparece marcada como arquivada nos filtros. |
| 2 | Nome único de Area por perfil | §3 (índice), §9.2 | Sim — unicidade enforced via índice único condicional `[profileId, nameNormalized]`. Validação case-insensitive, ignora espaços laterais. Aplica apenas a Areas ativas. |
| 3 | Reverter Sessão | §9.5, §3 (índice) | Soft delete via `archivedAt`. Sessão revertida some de listagens e métricas mas permanece no banco. CardReviews vinculados não são afetados (continuam imutáveis). Reversível. |
| 4 | Estratégias de restauração de backup | §9.8, §10.1 | Fase 1: estratégia padrão é criar novo profile a partir do backup (segura, reversível). Estratégia destrutiva (substituir profile) exige dupla confirmação e gera backup automático pré-substituição. Merge fica para Fase 2. |
| 5 | Timing de solicitação de Persistent Storage | §11.3 | Solicitar após primeira ação significativa (criar primeiro Tema/Card/Sessão ou converter primeira Capture), não no boot. Uma única vez. Resultado registrado em `_meta.storagePersistedStatus`. |
| 6 | Backup por perfil na Fase 1 | §9.8, §11.5 | Sim. Fase 1 oferece dois modos: backup global (`full`) e backup por perfil (`profile_only`). |
| 7 | Política de retenção de CardReviews | §11.6 | Fase 1: nenhuma retenção, nenhuma compressão, nenhum apagamento automático. CardReviews são sagrados. Discussão de política só na Fase 2 e apenas se a quota se mostrar problema real em uso observado. |

**Resultado:** documento sem pendências em aberto. Todas as decisões necessárias para iniciar a implementação da Fase 1 estão fechadas.

---

# Fim do documento

**Versão:** 2.0 (consolidada)
**Histórico:**
- V1.0 — primeira proposta com 7 pendências marcadas.
- V2.0 — pendências resolvidas, decisões aplicadas no corpo do schema.

**Próximo passo natural:** este documento vira a base para o prompt de implementação do Cursor (infraestrutura de banco da Fase 1).

**Travas reafirmadas neste documento:**
- Sem código.
- Sem prompt para Cursor.
- Sem backend.
- IndexedDB como persistência principal.
- Multi-perfil isolado.
- IDs imutáveis.
- Métricas derivadas.
- Backup como cidadão de primeira classe.
- VRVS 3P preservado.
- Mobile-first iPhone Safari.
