# Modelo de Dados — Nova VRVS

**Autor:** Claude (Opus), arquiteto de produto/dados
**Versão do documento:** 1.1
**Status:** fundação documental — verdade conceitual do produto.
**Escopo:** define o que cada entidade significa no produto, qual papel cumpre, e como se relaciona com as outras em linguagem de domínio.

**Changelog v1.0 → v1.1 (revisão cirúrgica):**
- §2 Profile: introduzido bloco "Profile.preferences vs. AppSettings" para separar configuração da instalação de preferências do perfil.
- §4 Tema: fixados os quatro status oficiais (`not_started`, `in_study`, `paused`, `mastered`) com semântica de cada um.
- §8 AgendaItem: padronizado vocabulário — estado técnico `snoozed`, label de interface "adiado". `postponed` removido.
- §10 AppSettings: reforçada a fronteira com `Profile.preferences`, com lista do que vai em cada lugar.
- §11 BackupMetadata: explicitada a hierarquia de restore (novo Profile como padrão; substituir como caminho destrutivo com confirmação forte; merge na Fase 2).

**O que este documento É:**
- Verdade conceitual. Significado das entidades, papéis no produto, regras de negócio.
- Leitura primária para entender o produto.
- Linguagem de domínio, sem jargão de banco.

**O que este documento NÃO é:**
- Não é especificação técnica de banco. Para isso, ler `SCHEMA_INDEXEDDB_v2.md`.
- Não lista campos completos, índices, keyPaths. Cita campos só quando essencial para explicar o conceito.
- Não é código, não é prompt para Cursor.

**Divisão de papéis com SCHEMA:**
- **MODELO_DE_DADOS manda no "o quê"** — significado, papel, regras de negócio.
- **SCHEMA manda no "como guardar"** — estrutura técnica, índices, performance.
- Quando alguém pergunta "o que é um Tema?", lê este documento. Quando pergunta "como Tema é armazenado?", lê o SCHEMA.

**Convenção:**
- **[FATO]** — trava do projeto ou decisão registrada em documento anterior.
- **[CONSEQUÊNCIA]** — dedução direta de uma decisão anterior.
- **[DECIDIDO]** — pendência fechada em conversa.
- **[APOSTA]** — proposta minha, sujeita a discussão.
- **[FASE FUTURA]** — fora do escopo da Fase 1.

---

## Sumário

1. Visão de domínio em uma página
2. Profile — o usuário operacional
3. Area — taxonomia auxiliar
4. Tema — unidade central de organização
5. Card — unidade atômica de revisão
6. CardReview — evento histórico imutável
7. Sessão — registro de tempo investido
8. AgendaItem — compromisso materializado
9. Capture — entrada flexível
10. AppSettings — configuração global
11. BackupMetadata — registro de salvaguardas
12. Entidades de Fase 2
13. Mapa de relações conceituais
14. Princípios transversais

---

# 1. Visão de domínio em uma página

A nova VRVS é uma ferramenta de **estudo médico longitudinal**. Não tem prazo, não tem prova-alvo. É infraestrutura para a vida profissional contínua de Vini.

O domínio gira em torno de quatro verbos:

1. **Organizar** o que se estuda (Tema, Area).
2. **Capturar** o que aparece sem rumo definido (Capture).
3. **Estudar/Revisar** ativamente (Sessão, Card, CardReview).
4. **Lembrar de voltar** (AgendaItem).

E uma constante que sustenta tudo:

5. **Sobreviver a perdas** (BackupMetadata, AppSettings, Profile como contêiner).

**Tema é o centro gravitacional do produto.** Quase tudo orbita um Tema. Mas existem fronteiras estudadas onde a obrigação de Tema é relaxada: Capture nasce sem Tema, Sessão Livre não exige Tema na Fase 1. **[FATO — trava do projeto.]**

**Cards e Reviews vivem dentro de Temas.** Card sem Tema é proibido. Pergunta solta nasce como Capture, não como Card. **[FATO]**

**Agenda é o módulo central de uso diário.** É onde Vini chega quando abre o app no dia a dia. **[FATO]**

**Hub Diário é visão derivada.** Não tem dados próprios. Reorganiza informação que vive em outras entidades. **[FATO]**

---

# 2. Profile — o usuário operacional

## 2.1 O que é

Um Profile representa um **contexto de uso isolado**. É o contêiner de tudo: Areas, Temas, Cards, Reviews, Sessões, Agenda, Captures pertencem a um Profile específico.

**Não é "conta de usuário" no sentido de servidor.** A nova VRVS não tem servidor. Profile é unidade local de organização.

## 2.2 Por que existe

Permite:
- Múltiplos perfis no mesmo dispositivo (ex.: "Estudo clínico" vs. "Estudo de pesquisa").
- Importar backup de outro perfil sem misturar com o ativo.
- Migrar para outro dispositivo via backup sem confundir contextos.

## 2.3 Papel no produto

- Profile **ativo** (`activeProfileId`) é o contexto operacional global. Todas as telas mostram apenas dados do perfil ativo. **[FATO]**
- Trocar de Profile é gesto consciente, feito em "Mais".
- Profile arquivado não pode ser ativo. Some da lista de troca, mas dados permanecem recuperáveis.

## 2.4 Regras de negócio

- Profile sempre tem um nome humano. Não precisa ser único globalmente, mas o app encoraja nomes distintos para evitar confusão.
- Profile arquivado é soft delete. Hard delete só por ação explícita em "Mais > Avançado", com confirmação forte. **[APOSTA — Fase 1 pode não expor hard delete; reavaliar.]**
- Não existe migração automática de dados entre Profiles. Mover Tema do Profile A para Profile B na Fase 1: não suportado. **[FASE FUTURA]**

## 2.5 Profile.preferences vs. AppSettings — fronteira

Existem dois lugares onde "configuração" pode viver, e a separação é importante:

- **AppSettings** — configuração **global da instalação**. Não muda quando o Profile ativo muda. Ver §10.
- **Profile.preferences** — preferências **específicas daquele Profile**. Acompanham o Profile em backup/restore. Mudam quando o Profile ativo muda.

**Regra prática para decidir onde algo vive:**
- Pergunta: "se eu trocar de Profile, isto deveria mudar junto?"
  - **Sim** → vai em `Profile.preferences`.
  - **Não** → vai em `AppSettings`.
- Pergunta: "se eu restaurar o backup deste Profile em outro dispositivo, isto deveria viajar junto com o conteúdo?"
  - **Sim** → vai em `Profile.preferences`.
  - **Não** → vai em `AppSettings`.

**Exemplos do que vive em `Profile.preferences`:**
- Tema visual preferido **deste perfil**, se houver diferenciação por perfil. **[APOSTA — pode ser global em AppSettings se Vini achar overkill ter por perfil.]**
- Configurações de comportamento do VRVS 3P específicas do perfil (ex.: agressividade do algoritmo, se virar opção). **[FASE FUTURA]**
- Preferências de exibição da Agenda do perfil (ex.: incluir cards adiados manualmente no topo). **[FASE FUTURA]**
- Última Area filtrada, último Tema visitado — estado de UX que faz sentido por perfil. **[APOSTA]**

**Exemplos do que vive em `AppSettings`:**
- `activeProfileId`.
- Status da Persistent Storage API.
- Versão do schema vista pela última vez.
- Tema visual global (se decidirmos que é global, não por perfil).
- Idioma da instalação.

**Princípio:** quando há dúvida, default para `Profile.preferences`. AppSettings é reservado para o que é genuinamente da instalação. Decidir errado e mover depois é fácil; misturar os dois é dor de cabeça eterna.

**[DECIDIDO — separação formalizada na v1.1.]**

## 2.6 Pegadinhas conceituais

- Profile **não é** sinônimo de "tema de estudo". Profile é o contêiner; Temas vivem dentro dele.
- Profile **não é** sinônimo de "dispositivo". Um dispositivo pode ter vários Profiles. Um Profile pode existir em vários dispositivos via backup.
- Profile **não tem** sincronização entre dispositivos na Fase 1. Backup manual é o único caminho. **[FATO]**
- `Profile.preferences` **não é** AppSettings. Confundir os dois leva a bugs sutis em troca de perfil e em restore. Ver §2.5.

---

# 3. Area — taxonomia auxiliar

## 3.1 O que é

Area é um **agrupador organizacional de Temas**. Serve para filtrar e visualizar Temas por grande domínio (ex.: "Joelho", "Ombro", "Coluna").

**Area não tem cards, não tem reviews, não tem sessões.** Não é unidade de estudo. É só taxonomia.

## 3.2 Por que existe

Em uso longitudinal, a quantidade de Temas tende a crescer (dezenas, centenas em anos). Sem agrupador, a lista vira poluição visual. Area resolve isso sem forçar hierarquia rígida.

## 3.3 Papel no produto

- **Filtro** na lista de Temas.
- **Etiqueta** mostrada junto ao Tema em algumas telas.
- **Não é prisão.** Tema sem Area é permitido conceitualmente, mas o app oferece uma Area "Geral" automática para garantir que todo Tema tenha pelo menos uma. **[FATO — §4.2 do SCHEMA define que `areaId` é obrigatório no Tema, garantido pela Area "Geral".]**

## 3.4 Regras de negócio

- Nome de Area é único dentro do Profile, ignorando caixa e espaços laterais. **[DECIDIDO — pendência 2 do SCHEMA.]**
- Arquivar Area **não arquiva os Temas que pertencem a ela.** Sem cascata. **[DECIDIDO — pendência 1 do SCHEMA.]**
  - Justificativa: arquivar Area é gesto organizacional (limpar lista de filtros), não declaração sobre o conteúdo dos Temas.
  - Tema continua ativo, gerando revisões, contando métricas. Apenas mostra a Area marcada como arquivada nos filtros.
- Reuso de nome após arquivamento é permitido (índice condicional resolve isso tecnicamente; conceitualmente, é "nome livre porque o anterior foi arquivado").

## 3.5 Pegadinhas conceituais

- Area **não é** Tema com hierarquia. Não existem sub-Areas, sub-Temas. A hierarquia é Profile → Area → Tema → Card. Plana e fixa. **[FATO]**
- Area **não tem** prioridade, status, métricas próprias. É só rótulo. Quando alguém pede "métricas da Area X", o que faz sentido é "soma das métricas dos Temas da Area X" — e isso é cálculo derivado, não dado persistido.
- Mover Tema de uma Area para outra é gesto barato, sem efeito retroativo em métricas. As métricas seguem com o Tema, não com a Area.

---

# 4. Tema — unidade central de organização

## 4.1 O que é

Tema é a **unidade central** do produto. Um Tema representa um assunto de estudo coerente: "Manguito Rotador", "Hérnia de Disco Lombar", "Antibioticoterapia em Ortopedia".

Tudo que importa orbita um Tema:
- Cards pertencem a um Tema.
- Sessões geralmente acontecem dentro de um Tema.
- AgendaItems frequentemente apontam para um Tema.
- Métricas de progresso são calculadas por Tema.

## 4.2 Por que existe

Estudo longitudinal precisa de um nível organizacional onde "voltar a estudar isso" faz sentido. Card é granular demais (uma pergunta). Area é amplo demais (um campo inteiro). Tema é o nível "humano" — onde Vini diz "preciso revisar manguito" e o produto sabe o que isso significa.

## 4.3 Papel no produto

- **Container de Cards.** Cards só existem dentro de um Tema.
- **Alvo principal de Sessões.** Quase toda Sessão tem um Tema.
- **Alvo principal de AgendaItems.** "Estudar Tema X amanhã".
- **Unidade de prioridade.** Tema tem prioridade que afeta como ele aparece em listas e na Agenda. (Sem detalhar campos — ver SCHEMA.)
- **Unidade de status.** Tema tem ciclo de vida explícito (`not_started`, `in_study`, `paused`, `mastered`). Detalhado em §4.4.
- **Unidade de notas.** Na Fase 1, anotações livres vivem como campo do Tema (`notes`). **[FATO]** Em Fase 2, Note pode virar entidade própria. **[FASE FUTURA]**

## 4.4 Status oficiais do Tema

**[DECIDIDO — fixado na v1.1.]**

Tema tem **quatro status oficiais**, e apenas esses quatro. Qualquer estado adicional precisa de decisão consciente para entrar.

| Status | Significado | Quando entra | Comportamento |
|---|---|---|---|
| `not_started` | Tema criado, mas estudo ainda não começou. | Default ao criar. | Aparece em listas, mas separado dos "em estudo". Pode ter cards e AgendaItems planejados. Não puxa Agenda virtual ativa (sem cards com `nextReviewDate` ainda). |
| `in_study` | Tema em estudo ativo. | Ao iniciar primeira Sessão, criar primeiro Card, ou marcação manual. | Estado padrão de uso. Cards geram revisões. Aparece com prioridade na Agenda. |
| `paused` | Tema temporariamente fora do radar. Vini pretende voltar. | Marcação manual em "editar Tema". | Cards **não geram revisões** enquanto pausado (suspensão idêntica a arquivar para efeito de Agenda). AgendaItems pendentes ficam suspensos visualmente, mas **não são cancelados** (intenção preservada). Aparece em filtro próprio. |
| `mastered` | Tema dominado. Vini considera que não precisa de revisão ativa. | Marcação manual. | Cards **não geram revisões**. Tema some da Agenda do dia, mas continua acessível em listagens com filtro. Métricas históricas preservadas. **[APOSTA — pode ser interessante revisão de manutenção esporádica em Fase 2; nada na Fase 1.]** |

**Distinção importante: status vs. arquivamento.**

- Status (`paused`, `mastered`) é declaração sobre o **ciclo de estudo** do Tema. Tema continua "ativo" no banco — aparece em listas, é referenciável.
- Arquivar (`archivedAt`) é declaração de "este Tema saiu da minha visão atual". Soft delete. Filtros padrão escondem.

Um Tema `mastered` ainda é Tema vivo, navegável, exibido em listas com filtro apropriado. Um Tema arquivado não. Não confundir.

**Transições permitidas:**

- `not_started` → `in_study` — começou a estudar.
- `in_study` ↔ `paused` — pausou ou retomou.
- `in_study` → `mastered` — dominou.
- `mastered` → `in_study` — voltou a estudar (esqueceu, mudaram diretrizes, quer reforçar).
- Qualquer status → arquivado, via `archivedAt`. Não é mudança de status, é arquivamento.

**[APOSTA]** Não permito `not_started` → `mastered` direto sem passar por `in_study`. Faz sentido pedagógico e simplifica análise de funil. Reabrir só se Vini pedir.

**Comportamento na Agenda virtual de cards vencendo:**

- `in_study` — cards entram normalmente.
- `not_started`, `paused`, `mastered` — cards **não entram** na Agenda virtual.

Isso significa que pausar Tema é gesto barato e reversível para "tirar do caminho sem perder nada".

## 4.5 Regras de negócio

- Tema sempre pertence a uma Area (mesmo que seja a Area "Geral" automática).
- Tema arquivado:
  - Cards do Tema **suspendem geração de revisões**. Não geram items na Agenda virtual de cards vencendo.
  - Sessões existentes do Tema permanecem no histórico.
  - AgendaItems pendentes apontando para o Tema são **cancelados** (some da Agenda).
  - Tema some de listas ativas, mas continua referenciável (CardReviews antigos ainda apontam para ele).
- Tema pode mudar de Area sem perda histórica. **[FATO]**
- Tema **não pode ser deletado em hard delete na Fase 1** se tiver Cards, Reviews ou Sessões. Soft delete (arquivar) é o caminho. **[CONSEQUÊNCIA da regra geral de soft delete.]**

## 4.6 Tema é o centro, mas não é prisão

Esta é a fronteira mais importante do produto, e merece destaque:

- **Capture nasce sem Tema.** É entrada rápida, sem fricção. Só vira algo "preso a Tema" quando convertida. **[FATO]**
- **Sessão Livre é permitida na Fase 1.** Sessão sem `temaId`, marcada como exceção, com `pendingAssociation` ativo até ser editada manualmente. **[FATO — decisão de fronteira 2.]**
- **Cards continuam exigindo Tema.** Sem exceção. **[FATO — decisão de fronteira 3.]**

Resumindo: o produto **encoraja** organização em Temas, mas **acomoda** os momentos de fluxo (estudar agora, organizar depois) através de Capture e Sessão Livre.

## 4.7 Pegadinhas conceituais

- Tema **não é** "matéria" no sentido de currículo de prova. É unidade prática de "isso aqui é o assunto que estou trabalhando".
- Tema **não tem** algoritmo de revisão próprio. O algoritmo VRVS 3P opera sobre Cards, não sobre Temas. Métricas de progresso do Tema são derivadas dos Cards e Sessões. **[FATO]**
- Tema **pode existir sem Cards**. Um Tema com zero Cards e algumas Sessões é totalmente válido — Vini estuda o tema com material externo, registra o tempo investido, sem necessariamente criar cards.
- Tema `paused` **não é** Tema arquivado. Ver §4.4. Os dois conceitos coexistem e respondem a perguntas diferentes.

---

# 5. Card — unidade atômica de revisão

## 5.1 O que é

Card é a **menor unidade de revisão ativa** do produto. Tipicamente uma pergunta com resposta, ou um conceito a ser revisado.

Card é onde o algoritmo VRVS 3P vive. Cada Card tem um estado de revisão (próxima data prevista, número de acertos/erros, etc.) que evolui conforme Vini responde.

## 5.2 Por que existe

Revisão espaçada precisa de unidades atômicas. Cada Card é um "compromisso" individual de revisão. Sem essa atomização, não há como o algoritmo decidir "este conceito você precisa revisar amanhã, mas este outro pode esperar duas semanas".

## 5.3 Papel no produto

- **Unidade de revisão VRVS 3P.** Cada Card tem ciclo próprio de revisão.
- **Filho de Tema.** Sempre pertence a exatamente um Tema. **[FATO]**
- **Origem de CardReviews.** Cada vez que Vini revisa um Card e responde, gera um evento CardReview imutável.
- **Alvo de AgendaItem.** Card vencendo aparece na Agenda virtual.

## 5.4 Estado do Card — modelo híbrido

**[FATO — decisão de fronteira 4.]**

O Card carrega um **cache do estado atual** (próxima data, intervalo, acertos seguidos, etc.) para que a Agenda virtual seja instantânea. Mas a **verdade histórica** vive em CardReviews. O cache é reconstruível a partir do histórico.

Por que híbrido:
- Sem cache, calcular "este card vence hoje?" para todos os cards toda vez que abre a Agenda é caro.
- Sem histórico imutável, não há como auditar/refazer o algoritmo, nem como migrar para outro algoritmo no futuro sem perder o passado.
- Cache é otimização de performance; histórico é fonte de verdade.

**Consequência:** se houver suspeita de divergência entre cache e histórico, o cache pode ser **reconstruído** percorrendo CardReviews. Isso é operação de manutenção, não de uso normal. **[FASE FUTURA — botão de "recalcular estado dos cards" em "Mais > Manutenção".]**

## 5.5 Regras de negócio

- Card sempre tem `temaId`. Card sem Tema não existe. **[FATO]**
- `cardId` é imutável após criação. **[FATO]**
- `temaId` é editável. Mover Card de Tema A para Tema B é permitido.
  - **CardReviews antigos NÃO são reescritos.** Permanecem apontando para o Tema antigo. **[FATO — §4.3 do SCHEMA.]**
  - Reviews futuras passam a contar para o novo Tema.
  - Justificativa: a review aconteceu no contexto do Tema antigo. Reescrever história é mentira retroativa.
- Card arquivado:
  - Não gera mais revisões.
  - AgendaItems pendentes apontando para o Card são cancelados.
  - CardReviews permanecem no histórico (imutáveis).

## 5.6 Pegadinhas conceituais

- Card **não é** Capture. Capture é entrada bruta, sem Tema, sem algoritmo. Card é compromisso ativo de revisão dentro de um Tema. Capture pode **virar** Card via conversão. **[FATO]**
- Card **não é** anotação livre. Para anotações sem revisão ativa, existe `Tema.notes` na Fase 1.
- Card **tem** estado, mas o estado **não é** verdade — é cache. Verdade está em CardReviews.

---

# 6. CardReview — evento histórico imutável

## 6.1 O que é

CardReview é o **registro de uma resposta dada a um Card em um momento específico**. Cada vez que Vini abre um card, lê a pergunta, responde mentalmente e clica em "Esqueci/Lembrei/Fácil", nasce um CardReview.

**CardReviews são imutáveis.** Após criados, não mudam. Não são editados, não são deletados. **[FATO]**

## 6.2 Por que existe

Três razões inegociáveis:

1. **Verdade histórica.** Saber exatamente o que aconteceu em cada revisão, na ordem certa, com os dados originais. Reescrita destrói essa verdade.
2. **Reconstrução de estado.** Cache do Card pode ser reconstruído a partir de CardReviews. Sem histórico, cache corrompido seria perda permanente.
3. **Métricas e auditoria.** Quanto tempo investi em manguito nos últimos 6 meses? Quantos cards revisei semana passada? Tudo deriva de CardReviews.

## 6.3 Papel no produto

- **Fonte de verdade do algoritmo VRVS 3P.**
- **Base de cálculo de métricas históricas** (acertos por tema, tempo total de estudo por período, evolução de performance).
- **Vínculo com Sessão de revisão.** Quando uma Sessão tipo `review` acontece, os CardReviews gerados durante ela carregam `sessionId`. **[FATO — decisão de fronteira 5.]**

## 6.4 Regras de negócio

- CardReview carrega `cardId` (referência ao card revisado), `profileId`, `temaId` (denormalizado, snapshot do tema no momento da review), e `sessionId` (opcional, presente se a review aconteceu dentro de uma Sessão tipo `review`).
- `temaId` é **denormalizado e congelado** no momento da review. Se o Card mudar de Tema depois, o CardReview antigo continua apontando para o Tema original. **[FATO — §4.3 do SCHEMA.]**
- CardReview **nunca** é deletado em uso normal. Nem soft delete. Imutável. **[FATO]**
  - Exceção operacional: se um Card é deletado em hard delete (cenário raro, exige Card sem Reviews), seus CardReviews também não existem.
  - Exceção de manutenção: importação de backup pode substituir tudo, incluindo CardReviews. Mas isso é "reset com restore", não "edição". **[CONSEQUÊNCIA do modelo de backup.]**

## 6.5 Pegadinhas conceituais

- CardReview **não é** "histórico de Sessões". Sessão é unidade de tempo investido (com ou sem Cards). CardReview é evento de revisão de um Card específico. Uma Sessão tipo `review` produz vários CardReviews; uma Sessão tipo `study` não produz nenhum.
- CardReview **não é** editável "para corrigir um clique errado". Se Vini clicou "Esqueci" sem querer, o caminho é responder novamente em outro momento. O histórico fica registrado como aconteceu.
- CardReview **não tem** soft delete. Não tem `archivedAt`. Está fora do padrão geral por decisão consciente de imutabilidade. **[FATO]**

---

# 7. Sessão — registro de tempo investido

## 7.1 O que é

Sessão é o **registro de um intervalo de tempo dedicado a estudo**. Tem início, fim, duração, e geralmente um Tema associado.

Existem dois tipos:
- **`study`** — sessão de estudo livre. Vini estudou material, leu artigo, assistiu aula. Não revisou cards.
- **`review`** — sessão de revisão de cards. Produz CardReviews. **[FATO — decisão de fronteira 5.]**

## 7.2 Por que existe

Estudo médico longitudinal não é só revisar cards. Boa parte do trabalho é leitura, anotação, escuta de aulas, discussão de casos. Sem registrar isso, o produto não enxerga o esforço real — só enxergaria a parte automatizável (cards). Sessão preenche essa lacuna.

## 7.3 Papel no produto

- **Registro de tempo investido.** "Estudei manguito 45 minutos hoje."
- **Base de métricas de esforço por Tema.** "Tempo total em manguito nos últimos 30 dias."
- **Container de CardReviews** quando tipo é `review`. **[FATO]**
- **Item de histórico.** Lista cronológica do que foi feito.

## 7.4 Regras de negócio

- Sessão tem tipo (`study` ou `review`). Tipo é definido na criação. **[FATO]**
- Sessão tipo `review` **exige** `temaId`. Não existe Sessão Livre de revisão. **[FATO]**
- Sessão tipo `study` **pode ser Livre** (sem `temaId`) na Fase 1. **[FATO — decisão de fronteira 2.]**
  - Sessão Livre nasce com flag `pendingAssociation = true`.
  - Vini pode editar a Sessão depois para associar a um Tema (adoção retroativa).
  - Quando associada, `pendingAssociation` vira `false` e a Sessão passa a contar nas métricas do Tema.
  - **Sessão Livre é exceção, não caminho preferido.** A UI deve sinalizar isso (não esconder, não envergonhar, mas mostrar que está pendente). **[APOSTA de UX — detalhar em ARQUITETURA_FASE_1.]**
- Reverter Sessão é **soft delete** via `archivedAt`. **[DECIDIDO — pendência 3 do SCHEMA.]**
  - Sessão revertida some de listagens e métricas, mas permanece no banco.
  - **CardReviews vinculados à Sessão revertida NÃO são afetados.** Continuam imutáveis no histórico. **[FATO]**
  - Reversão é reversível: dá para "desreverter" voltando o `archivedAt` para null.
  - Justificativa: reverter Sessão é gesto de "esta sessão foi um erro de registro" (apertei começar sem querer, esqueci aberta). Mas se ela produziu CardReviews, esses eventos já mexeram no estado dos cards e fazem parte da história — não dá para apagar.

## 7.5 Pegadinhas conceituais

- Sessão **não é** Card. Sessão é tempo; Card é compromisso de revisão. Uma Sessão pode existir sem Cards (tipo `study`), e Cards podem ser revisados sem Sessão (cenário hipotético de revisão fora de sessão estruturada — Fase 1 não vai por esse caminho, todo card revisado vive em uma Sessão tipo `review`). **[CONSEQUÊNCIA — toda revisão de card na Fase 1 é parte de uma Sessão `review`.]**
- Sessão Livre **não é** "Sessão sem propósito". É "Sessão cujo propósito ainda não foi formalizado em Tema". A intenção é capturar o esforço primeiro, organizar depois.
- Reverter Sessão **não é** "desfazer Sessão". Os CardReviews permanecem. É soft delete da unidade Sessão, não rollback dos eventos que ela conteve.

---

# 8. AgendaItem — compromisso materializado

## 8.1 O que é

AgendaItem é um **compromisso explícito de fazer algo em uma data**. Pode ser "estudar Tema X amanhã", "revisar bloco de Cards na quinta", "ler artigo Y no fim de semana".

**Atenção:** AgendaItem é diferente da **Agenda virtual de Cards vencendo**. Os cards vencendo do dia (calculados em tempo real a partir de `nextReviewDate` dos Cards) **não** são AgendaItems. São visão derivada. AgendaItem é compromisso **materializado** — registro persistente de uma intenção do usuário.

## 8.2 Por que existe

VRVS 3P responde "quando devo revisar este card". Mas Vini também precisa de:
- "Estudar Tema novo na semana que vem" (não tem cards ainda).
- "Ler artigo enviado pelo colega na sexta" (nem é Tema ainda, é só uma intenção).
- "Bloquear sessão de 2h no domingo para revisar manguito" (compromisso de tempo).

AgendaItem cobre esses casos. É a "to-do com data" do produto.

## 8.3 Papel no produto

- **Item materializado da Agenda.** Aparece na tela "Agenda" do dia/semana.
- **Polimórfico via `targetType` + `targetId`.** Pode apontar para Card, Tema, ou nenhum (item livre). **[FATO — §1.3 do SCHEMA.]**
- **Pode existir sem target.** "Lembrar de pesquisar sobre osteonecrose" sem ainda ter Tema criado. Vira "intenção solta" na Agenda.

## 8.4 Tipos e estados

A nova VRVS distingue conceitualmente:

- **AgendaItem com `targetType = 'card'`** — "revisar este card específico em X". Tipicamente derivado de adiamento manual ou de marcação especial.
- **AgendaItem com `targetType = 'tema'`** — "estudar este tema em X".
- **AgendaItem sem target (livre)** — "fazer algo em X", sem entidade vinculada. Pode opcionalmente ser linkado a um Tema posteriormente via `manualLinkedTemaId`.

**Estados oficiais:** `pending`, `done`, `skipped`, `snoozed`. **[DECIDIDO — fixado na v1.1.]**

| Estado técnico | Label de interface | Significado |
|---|---|---|
| `pending` | "pendente" | Item ativo, aguardando ação. Default ao criar. |
| `done` | "concluído" | Item realizado. Histórico. |
| `skipped` | "pulado" | Vini decidiu não fazer este item, sem intenção de remarcar. Histórico. |
| `snoozed` | "adiado" | Vini empurrou a data. Item continua ativo, com nova `scheduledDate`. |

**Vocabulário padronizado:**
- **Estado técnico no banco:** `snoozed`. Esse é o nome canônico em código, schema, backup, logs.
- **Label exibida ao usuário:** "adiado". Esse é o termo que aparece em botões, badges, mensagens.
- **Termo proibido:** `postponed`. Não usar em código nem em UI. **[DECIDIDO — para evitar coexistência de dois termos para o mesmo conceito.]**

**Comportamento de "adiar":**
- Adiar **altera `scheduledDate` no mesmo registro** e marca o estado como `snoozed`. Não cria novo registro. **[DECIDIDO — fixado na v1.1, fechando a [APOSTA] da v1.0.]**
  - Justificativa: criar novo registro a cada adiamento polui o store e quebra o invariante "um Card tem no máximo um AgendaItem pendente apontando para ele".
  - Histórico de adiamentos pode ser registrado em campo auxiliar do próprio item (ex.: `snoozeHistory[]`) se for útil. **[APOSTA — detalhar em SCHEMA se for adotado.]**
- Item `snoozed` continua ativo. Aparece na Agenda na nova data. Pode ser concluído, pulado, ou adiado novamente.
- Não há limite hard de quantas vezes pode adiar. **[APOSTA — Fase 2 pode introduzir nudge "este item já foi adiado 5 vezes".]**

Demais detalhes de UX por estado vão em ARQUITETURA_FASE_1.

## 8.5 Regras de negócio

- AgendaItem **pendente ou adiado** referenciando target arquivado é **cancelado** (removido da Agenda). **[FATO — §4.4 do SCHEMA.]**
  - Justificativa: intenção futura sem alvo perdeu sentido.
- AgendaItem **concluído** (`done`) é **histórico** e permanece, mesmo se o target for arquivado depois.
- AgendaItem **pulado** (`skipped`) é histórico. Permanece.
- Adiar AgendaItem altera `scheduledDate` e estado para `snoozed` no próprio registro. Sem novo registro. **[DECIDIDO — fixado na v1.1.]**
- AgendaItem **não substitui** a Agenda virtual de cards vencendo. As duas coexistem na tela "Agenda": cards vencendo (derivados) + AgendaItems materializados (persistidos).

## 8.6 Pegadinhas conceituais

- AgendaItem **não é** Card. Card vive em Tema, tem ciclo VRVS 3P. AgendaItem é compromisso. Um Card pode ter zero ou um AgendaItem **ativo** (estado `pending` ou `snoozed`) apontando para ele. Mais que isso é conflito de intenção. AgendaItems já em estado `done` ou `skipped` são histórico e não contam para o invariante.
- AgendaItem **não é** Capture. Capture é entrada bruta sem data nem destino. AgendaItem tem data (sempre) e pode ter destino (opcional).
- "A Agenda" como tela **não é** o store `agendaItems`. A tela combina:
  - Cards vencendo (derivado, não persistido).
  - AgendaItems materializados (persistido).
  - Possivelmente Sessões agendadas (se houver — discutir em ARQUITETURA_FASE_1).
- "Adiar" e "snoozed" referem-se **à mesma coisa**. "Adiar" é o que o usuário lê; `snoozed` é o que o código grava. Não inventar `postponed` em lugar nenhum.

---

# 9. Capture — entrada flexível

## 9.1 O que é

Capture é a **entrada rápida sem fricção**. Vini está no metrô, leu algo, teve uma ideia, ouviu uma pergunta interessante. Abre o app, captura. Não precisa decidir Tema, não precisa criar Card, não precisa pensar em organização. Só capturar.

## 9.2 Por que existe

O maior inimigo de uma ferramenta de estudo é fricção na captura. Se Vini precisa pensar "isto é Card de qual Tema?" antes de registrar, vai perder coisa. Capture remove essa fricção, oferecendo um destino genérico que pode ser organizado depois.

## 9.3 Papel no produto

- **Botão flutuante para criar.** Acessível de qualquer tela. **[FATO — decisão de fronteira 1.]**
- **Inbox para organizar.** Listada em "Mais" ou Hub para revisar e converter. **[FATO]**
- **Conversor para outras entidades.** Uma Capture pode virar:
  - **Tema novo.**
  - **Card** (em Tema existente).
  - **AgendaItem.**
  - **Arquivada** (não interessa mais).

**Uma Capture vira no máximo um destino.** Sem split, sem undo na Fase 1. **[FATO — §4.3 das Decisões.]**

## 9.4 Regras de negócio

- Capture nasce sem `temaId`, sem destino. Apenas com texto e timestamp.
- Capture tem status: `pending` (na inbox), `converted` (já virou outra coisa), `archived` (arquivada sem conversão).
- Capture convertida **não é deletada.** Vira histórico com referência ao destino criado (`convertedTo: { type, id }` ou similar — detalhe em SCHEMA).
- Capture arquivada também permanece no banco, com status mudado.

## 9.5 Fronteira clara com outras entidades

Esta fronteira foi explicitamente decidida e merece destaque:

- **Card sem Tema = Capture.** [FATO — decisão de fronteira 3.]
  - Quando alguém quer "criar uma pergunta agora sem decidir Tema", o sistema cria uma Capture, não um Card.
  - Mais tarde, na inbox, a Capture pode ser convertida em Card de um Tema específico.
- **Capture é entrada bruta**, não unidade de revisão. Não gera revisões VRVS 3P. Não tem `nextReviewDate`. Só vira parte do ciclo VRVS 3P depois de virar Card.

## 9.6 Pegadinhas conceituais

- Capture **não é** "lixeira de coisas para depois". É inbox ativa de itens que ainda não decidiram o que vão ser. A diferença é semântica e impacta UX: a UI de Capture não é arquivo morto, é "fila a processar".
- Capture **não tem** revisão espaçada. Permanece na inbox até Vini decidir. Não há "Capture vencendo".
- Capture **não migra** entre Profiles. Vive no Profile onde nasceu.

---

# 10. AppSettings — configuração global

## 10.1 O que é

AppSettings é o **registro singleton de configuração da instalação**. Não pertence a um Profile específico. Não viaja em backup `profile_only`. É do dispositivo/instalação, não do conteúdo.

**Companheira inseparável:** `Profile.preferences`. Ver §2.5 para a fronteira detalhada. Em uma frase: AppSettings é da instalação, `Profile.preferences` é do perfil.

## 10.2 Por que existe

Algumas configurações precisam existir antes de qualquer Profile (ex.: `activeProfileId` — sem ele, o app não sabe qual perfil abrir). Outras são realmente da instalação e não fariam sentido por perfil (status de Persistent Storage API, versão do schema, idioma da instalação).

AppSettings concentra esse núcleo mínimo de configuração que precisa estar fora dos Profiles.

## 10.3 Papel no produto

- **Guarda `activeProfileId`.** Qual Profile está ativo agora.
- **Guarda flags de instalação.** Persistente storage solicitada, schemaVersion conhecida, idioma da instalação.
- **Guarda preferências de UI globais**, se decidirmos que a UI é igual entre perfis (ex.: tema Liquid Glass como trava — não é configurável; modo claro/escuro, se vier, **provavelmente** vai aqui em vez de em `Profile.preferences`, mas é decisão a fechar). **[APOSTA]**

## 10.4 O que NÃO vai em AppSettings

- **Nada que seja específico de um Profile.** Vai em `Profile.preferences`.
- **Nada que seja conteúdo de estudo.** Tema, Card, Sessão têm seus próprios stores.
- **Histórico de qualquer coisa.** Histórico vive nas entidades que registram eventos (Sessão, CardReview, BackupMetadata).

Em caso de dúvida, aplicar o teste do §2.5: "se eu trocar de Profile, isto deveria mudar junto?" — Sim → `Profile.preferences`. Não → AppSettings.

## 10.5 Regras de negócio

- Singleton. Sempre exatamente um registro com `id = 'singleton'`. **[FATO — §1.3 do SCHEMA.]**
- Toda escrita é upsert (`put`), nunca insert (`add`).
- Não tem `profileId`. É global. **[FATO]**
- Não tem soft delete. Reset de AppSettings é parte de "reset de fábrica" do app.
- **AppSettings não viaja em backup `profile_only`.** Viaja apenas em backup `full`. **[CONSEQUÊNCIA — backup por perfil deve ser portável entre instalações sem sobrescrever a configuração da instalação destino.]**

## 10.6 Pegadinhas conceituais

- AppSettings **não é** "preferência do usuário ativo". É "preferência da instalação". Trocar de Profile não muda AppSettings (exceto `activeProfileId`, que é o gesto de troca em si).
- AppSettings **não armazena dados de estudo.** Nunca.
- AppSettings **não é** `Profile.preferences`. Confundir os dois leva a bug clássico: configuração que deveria seguir o Profile fica presa na instalação, ou vice-versa. Ver §2.5.

---

# 11. BackupMetadata — registro de salvaguardas

## 11.1 O que é

BackupMetadata é o **log de backups gerados**. Cada vez que Vini gera um backup (manual ou automático), uma entrada é registrada aqui com timestamp, tipo, escopo e contagens.

**Importante:** BackupMetadata é **só o registro**. O arquivo de backup em si é exportado pelo sistema operacional (Share Sheet do iOS, Files), não vive dentro do IndexedDB.

## 11.2 Por que existe

- **Auditoria.** Saber quando foi o último backup, quantos backups já foram gerados.
- **Histórico para o usuário.** Lista "Mais > Backup" mostra histórico para Vini decidir se precisa gerar novo.
- **Suporte a migração estrutural.** Backups feitos automaticamente antes de migrações de schema marcam isso (`preMigration: true`).

## 11.3 Papel no produto

- **Log visível em "Mais > Backup".**
- **Disparador de avisos.** "Último backup há 60 dias" pode virar nudge. **[FASE FUTURA na lógica fina, mas o dado já vive aqui na Fase 1.]**
- **Registro de tipo de backup.**
  - `full` — backup global, todos os Profiles. **[DECIDIDO — pendência 6.]**
  - `profile_only` — backup só do Profile selecionado. **[DECIDIDO]**

## 11.4 Regras de negócio

- BackupMetadata é **global** (não por Profile). Mesmo backups `profile_only` registram o metadata globalmente.
- Não tem soft delete. Hard delete só por gesto explícito de "limpar histórico de backups", que é raro e não previsto na Fase 1.
- Cada entrada referencia o `profileId` se for `profile_only`, ou nenhum se for `full`.

## 11.5 Restore seguro — hierarquia de estratégias

**[DECIDIDO — pendência 4 do SCHEMA, reafirmada e explicitada na v1.1.]**

Restaurar backup é a operação mais arriscada do produto: pode sobrescrever dados reais com dados de outro momento. A nova VRVS adota uma **hierarquia explícita de três estratégias**, em ordem de risco crescente:

### Estratégia 1 — Restaurar como novo Profile (PADRÃO)

- O conteúdo do backup vira **um Profile novo** na instalação.
- Profiles existentes ficam **intocados**.
- `activeProfileId` da instalação **não muda** automaticamente — Vini decide trocar para o novo Profile depois.
- **Reversível por gesto único:** arquivar o Profile recém-criado.
- Sem confirmação extra além da escolha consciente do arquivo.
- **Aplicável a:** backups `profile_only` e `full` (no caso de `full`, criar tantos Profiles novos quantos houver no backup).

**Esta é a estratégia padrão. Quando Vini clica "Restaurar", esta é a opção que aparece selecionada por padrão.**

### Estratégia 2 — Substituir Profile existente (DESTRUTIVA)

- O conteúdo do backup **substitui completamente** um Profile existente escolhido por Vini.
- Os dados antigos do Profile substituído são **apagados** localmente.
- **Salvaguarda obrigatória antes de executar:** o app gera um **backup automático pré-substituição** do Profile que vai ser substituído, e registra em BackupMetadata com flag `preReplacement: true`. **[FATO — pendência 4 do SCHEMA.]**
- **Confirmação dupla obrigatória:**
  - Primeira confirmação: tela explica o que vai acontecer, mostra nome do Profile que será substituído, oferece backup automático visível.
  - Segunda confirmação: digitação do nome do Profile a substituir (ou gesto equivalente forte). **[APOSTA de UX — definir gesto exato em ARQUITETURA_FASE_1.]**
- **Aplicável a:** backups `profile_only` (substituir um Profile específico) e `full` (substituir tudo — caminho ainda mais destrutivo, exige confirmação ainda mais forte).

**Esta estratégia existe para o caso "perdi o aparelho, instalei do zero, quero meu Profile de volta no lugar que ocupava". Não para uso casual.**

### Estratégia 3 — Merge inteligente (FASE 2)

- Combinar conteúdo do backup com Profile existente, resolvendo conflitos.
- **Não disponível na Fase 1.** **[FATO — pendência 4 do SCHEMA.]**
- Razão: merge correto exige resolução de conflitos por entidade (mesmo `cardId` em estados diferentes, CardReviews sobrepostos, etc.). Implementar mal = perda de dados silenciosa. Esperar maturidade de Fase 2.

### Tabela-resumo

| Estratégia | Padrão? | Risco | Reversibilidade | Confirmação |
|---|---|---|---|---|
| 1. Novo Profile | sim | baixo | gesto único (arquivar) | escolha de arquivo |
| 2. Substituir | não | alto | só via backup pré-substituição | dupla confirmação + backup automático |
| 3. Merge | — | — | — | **[FASE FUTURA]** |

### Princípio operacional

**Default seguro, destrutivo opt-in.** Vini nunca chega na operação destrutiva por acidente. A Estratégia 1 resolve a maioria dos casos reais; a Estratégia 2 é caminho explícito que exige passar por avisos.

## 11.6 Pegadinhas conceituais

- BackupMetadata **não é** o backup. É o **registro** do backup. O backup em si é arquivo JSON exportado.
- Restaurar backup **não usa** BackupMetadata. Usa o arquivo JSON diretamente. BackupMetadata é só histórico/auditoria.
- "Restaurar" **não é** uma operação única. É uma de três estratégias (§11.5). A UI deve deixar isso claro.
- Backup pré-substituição (gerado automaticamente na Estratégia 2) **não é mágica**. É arquivo real, no Files do iOS, que Vini pode restaurar via Estratégia 1 se quiser desfazer a substituição.

---

# 12. Entidades de Fase 2

Entidades previstas mas **não materializadas na Fase 1**. Documentadas aqui para evitar surpresas na hora de planejar Fase 2.

## 12.1 Note (entidade própria)

Hoje, anotações vivem como campo `notes` no Tema. Isso resolve o caso simples (uma anotação livre por Tema). **[FATO]**

Em Fase 2, pode fazer sentido promover Note a entidade própria, com:
- Múltiplas Notes por Tema.
- Notes sem Tema (orbitando Capture ou Profile).
- Tags, busca, vinculação cruzada.

**[FASE FUTURA]** A migração v3 → v4 (hipótese) faria essa transformação.

## 12.2 Reminder

Notificação local programada. "Avisar para revisar manguito todo domingo às 9h."

**[FASE FUTURA]** Nada decidido. Pode nunca existir se AgendaItem + nudges discretos forem suficientes.

## 12.3 Tag/Label transversal

Em uso longitudinal, pode emergir necessidade de marcar Cards/Temas/Sessões com etiquetas transversais (ex.: "Trauma", "Pediatria") que cruzam Areas e Temas.

**[FASE FUTURA]** Adicionar Tag não quebra nada do modelo atual; só adiciona um store novo de relação.

## 12.4 Sync entre dispositivos

A trava do projeto é "sem backend". Mas backup é o caminho atual de portabilidade. Em algum futuro, sync automático (via cloud do usuário, peer-to-peer, ou backend opcional) pode ser revisitado.

**[FASE FUTURA]** Não é compromisso, é hipótese.

---

# 13. Mapa de relações conceituais

Versão em prosa do diagrama. Para diagrama formal e tabela de relações, ver SCHEMA §4.

## 13.1 A árvore principal

**Profile** é a raiz. Dentro dele:

- **Areas** — agrupadores rasos. Cada Area pode ter muitos Temas.
- **Temas** — pertencem a uma Area. Centro do produto.
- **Cards** — pertencem a um Tema. Sem exceção.
- **CardReviews** — pertencem a um Card, vivem em uma Sessão tipo `review`. Carregam snapshot do Tema.
- **Sessões** — pertencem a um Tema (geralmente). Sessão Livre é exceção sem Tema.
- **AgendaItems** — apontam para Card, Tema, ou nenhum.
- **Captures** — vivem soltas até serem convertidas.

## 13.2 Os globais

Fora da árvore por Profile:

- **AppSettings** — singleton da instalação.
- **BackupMetadata** — log global.

## 13.3 Os fluxos típicos

Para entender o produto, mais útil que o diagrama formal são os **fluxos típicos**:

**Fluxo 1 — Estudo organizado:**
Vini abre app → vê Agenda → escolhe Tema → inicia Sessão `study` → registra tempo → fim.

**Fluxo 2 — Revisão:**
Vini abre app → vê cards vencendo (Agenda virtual) → inicia Sessão `review` → responde cards → cada resposta gera CardReview → fim.

**Fluxo 3 — Captura no fluxo:**
Vini lê algo interessante → toca botão flutuante → escreve Capture → fecha → segue vida.

**Fluxo 4 — Organização da inbox:**
Vini em momento calmo → abre inbox de Captures → converte em Card/Tema/AgendaItem → inbox limpa.

**Fluxo 5 — Backup:**
Vini lembra → "Mais > Backup" → escolhe modo → gera arquivo → exporta para Files/iCloud/etc → BackupMetadata registra.

Estes fluxos guiam o que precisa ser instantâneo (Agenda, Capture) versus o que pode ser confortável mas não urgente (organização, backup).

---

# 14. Princípios transversais

Princípios que atravessam várias entidades e devem ser internalizados ao construir qualquer feature nova.

## 14.1 Soft delete é o padrão

Todo arquivamento conceitual é soft delete (`archivedAt`). Hard delete é exceção, só permitida quando zero referências. **[FATO — §4.5 do SCHEMA.]**

**Exceção:** CardReview não tem soft delete. É imutável. **[FATO]**

**Exceção:** AgendaItem ativo (estado `pending` ou `snoozed`) apontando para target arquivado é realmente removido (não soft delete), porque intenção sem alvo não tem valor histórico. AgendaItems já em estado `done` ou `skipped` permanecem como histórico. **[FATO — §4.5 do SCHEMA, ajustado na v1.1 para incluir `snoozed`.]**

## 14.2 IDs são imutáveis

Todo `id` (profileId, areaId, temaId, cardId, etc.) é gerado no cliente, em formato ULID com prefixo da entidade, e **nunca muda** após criação. **[FATO]**

Mover entidade entre containers (Card de Tema A para Tema B) muda referências, não IDs.

## 14.3 Métricas são derivadas

"Tempo total em Tema X", "cards revisados na semana", "acertos por área" — nada disso é persistido. Tudo é calculado em tempo real a partir das fontes de verdade (Sessões, CardReviews). **[FATO]**

Justificativa: persistir métricas exige reprocessar tudo a cada mudança e cria janelas de inconsistência. Cálculo derivado é mais lento, mas confiável.

**Otimização permitida:** caches de UI (memorização da última métrica calculada). Mas cache não é persistido. É runtime. **[APOSTA]**

## 14.4 Histórico é sagrado

CardReviews são imutáveis. Sessões revertidas não apagam CardReviews. Mover Card de Tema não reescreve histórico de reviews.

Em qualquer dúvida sobre "deveríamos atualizar este dado antigo?", a resposta padrão é **não**. Snapshot histórico é a regra.

## 14.5 Tema é centro, mas há fronteiras

- Capture = entrada sem Tema.
- Sessão Livre = Sessão sem Tema (Fase 1).
- Card sem Tema = não existe.

Esta tensão é **proposital**. O produto encoraja Tema como organização, mas acomoda momentos de fluxo.

## 14.6 Profile é absoluto

Nenhuma entidade de dados de usuário cruza Profiles. Filtragem por `profileId` é obrigação de qualquer query. **[FATO]**

Exceções: AppSettings e BackupMetadata, que são globais por design.

## 14.7 Estabilidade > novidade

Trava do projeto. **[FATO]** Em qualquer dúvida entre adicionar feature versus preservar comportamento existente, vence o existente.

---

# Fim do documento

**Versão:** 1.1
**Próximos documentos a materializar:**
1. **`DECISOES_FASE_0.md`** — registro consolidado das decisões fechadas.
2. **`ARQUITETURA_FASE_1.md`** — arquitetura prática da Fase 1.
3. **`PROTOCOLO_RECONSTRUCAO.md`** — só depois.

**Travas reafirmadas neste documento:**
- Tema é centro, com fronteiras estudadas (Capture, Sessão Livre).
- Card sem Tema não existe.
- CardReview é imutável.
- Soft delete é o padrão.
- IDs imutáveis.
- Métricas derivadas.
- Profile isola tudo.
- AppSettings é da instalação; `Profile.preferences` é do perfil. **(v1.1)**
- Tema tem 4 status oficiais: `not_started`, `in_study`, `paused`, `mastered`. **(v1.1)**
- AgendaItem usa `snoozed` no banco e "adiado" na UI. `postponed` é proibido. **(v1.1)**
- Restore tem 3 estratégias hierárquicas: novo Profile (padrão), substituir (destrutivo, dupla confirmação), merge (Fase 2). **(v1.1)**
- Multi-AI: Claude/Opus arquiteta, ChatGPT coordena, Vini decide, Cursor implementa (depois).
- Sem código, sem prompt para Cursor neste documento.
