# DECISOES_FASE_0.md — Nova VRVS

**Versão:** 1.0  
**Status:** documento de consolidação da Fase 0  
**Escopo:** registrar decisões já tomadas, separar o que está congelado do que é provisório, em aberto ou futuro, e impedir reabertura desnecessária de fundação.

---

# 1. Papel deste documento

Este documento consolida as decisões arquiteturais e conceituais da Fase 0 da nova VRVS.

Ele não é:
- código;
- prompt para Cursor;
- especificação visual;
- plano de implementação detalhado.

Ele serve para orientar os próximos documentos:

1. `ARQUITETURA_FASE_1.md`
2. `PROTOCOLO_RECONSTRUCAO.md`
3. entrada futura do Cursor, somente depois do protocolo.

---

# 2. Fontes de verdade atuais

## 2.1 Documento conceitual aprovado

- `MODELO_DE_DADOS.md v1.1`

Status: **aprovado como documento formal da Fase 0**.

Regra de leitura:
- `[FATO]`, `[DECIDIDO]` e travas do projeto = congelado.
- `[APOSTA]` = proposta aceita provisoriamente, refinável na `ARQUITETURA_FASE_1.md`.
- `[FASE FUTURA]` = fora da Fase 1.

## 2.2 Documento técnico aprovado

- `SCHEMA_INDEXEDDB_v2.md`

Status: **especificação técnica fechada do IndexedDB**.

Define:
- stores;
- keyPaths;
- índices;
- relações;
- integridade;
- persistido vs derivado;
- faseamento;
- comportamento defensivo no iPhone Safari/PWA.

---

# 3. Decisões congeladas

## 3.1 Natureza da nova VRVS

A nova VRVS é uma reconstrução do zero.

Decidido:
- nova VRVS não é remendo do legado;
- app atual é legado;
- repo novo separado do legado;
- a reconstrução não deve herdar bug, gambiarra ou estrutura problemática do app antigo;
- o legado serve como aprendizado e referência do que evitar.

Não reabrir sem motivo forte.

---

## 3.2 Plataforma e restrições técnicas

Decidido:

- PWA client-side;
- mobile-first para iPhone Safari;
- sem backend obrigatório;
- sem API;
- sem Python;
- sem servidor obrigatório;
- persistência principal em IndexedDB;
- funcionamento local/offline-first;
- estabilidade acima de novidade.

---

## 3.3 Perfis

Decidido:

- `Profile` é o contêiner operacional dos dados do usuário;
- todo dado de usuário pertence a um `profileId`;
- `activeProfileId` define o perfil operacional atual;
- nenhuma tela deve misturar dados de perfis diferentes;
- Profile arquivado não pode ser ativo;
- troca de Profile é gesto consciente;
- não há sincronização automática entre dispositivos na Fase 1.

---

## 3.4 AppSettings vs Profile.preferences

Decidido:

- `AppSettings` = configuração global da instalação;
- `Profile.preferences` = preferências específicas daquele perfil.

Regra prática:

- se deve mudar ao trocar de Profile → `Profile.preferences`;
- se pertence ao dispositivo/instalação → `AppSettings`.

Exemplos congelados:

- `activeProfileId` fica em `AppSettings`;
- preferências específicas do perfil ficam em `Profile.preferences`.

---

## 3.5 Area

Decidido:

- `Area` é taxonomia auxiliar;
- Area agrupa Temas;
- Area não tem Cards, Reviews ou Sessões;
- Area não tem métricas próprias persistidas;
- métricas por Area são derivadas dos Temas;
- todo Tema tem `areaId`;
- cada Profile tem uma Area "Geral" automática;
- arquivar Area não arquiva Temas;
- nome de Area é único dentro do Profile entre Areas ativas.

---

## 3.6 Tema

Decidido:

- Tema é a unidade central de organização;
- Tema é centro, mas não prisão;
- Tema pertence obrigatoriamente a uma Area;
- Tema pode existir sem Cards;
- Tema pode ter Sessões sem necessariamente ter Cards;
- Tema tem `notes` na Fase 1;
- Note como entidade própria fica para Fase 2.

Status oficiais do Tema:

- `not_started`
- `in_study`
- `paused`
- `mastered`

Esses quatro nomes são o vocabulário oficial.

---

## 3.7 Card

Decidido:

- Card é unidade atômica de revisão;
- Card sempre exige `temaId`;
- Card sem Tema não existe;
- pergunta solta nasce como Capture, não como Card;
- `cardId` é imutável;
- Card pode mudar de Tema mantendo o mesmo `cardId`;
- mover Card de Tema não reescreve CardReviews antigos;
- Card arquivado não gera novas revisões.

---

## 3.8 CardReview

Decidido:

- CardReview é evento histórico imutável;
- CardReview não é editado em uso normal;
- CardReview não tem soft delete;
- CardReview carrega snapshot de `temaId` no momento da revisão;
- se o Card mudar de Tema depois, Reviews antigas continuam apontando para o Tema antigo;
- CardReviews são fonte histórica para métricas, auditoria e reconstrução de estado.

---

## 3.9 Estado do Card

Decidido:

- modelo híbrido;
- Card guarda cache do estado atual;
- CardReview guarda verdade histórica;
- cache é otimização;
- histórico é fonte de verdade;
- estado do Card pode ser reconstruído a partir de CardReviews em operação futura de manutenção.

---

## 3.10 Sessão

Decidido:

- Sessão registra tempo investido;
- tipos oficiais na Fase 1:
  - `study`
  - `review`
- Sessão tipo `review` exige `temaId`;
- Sessão tipo `review` gera CardReviews;
- Sessão tipo `study` pode ser livre na Fase 1;
- Sessão Livre nasce com `pendingAssociation = true`;
- Sessão Livre é exceção controlada, não caminho principal;
- reverter Sessão é soft delete;
- reverter Sessão não apaga CardReviews.

---

## 3.11 Agenda

Decidido:

- Agenda é módulo central;
- Agenda é a entrada principal de uso diário;
- Agenda como tela não é sinônimo de store `agendaItems`;
- a tela Agenda combina dados persistidos e derivados;
- cards vencendo são visão derivada a partir de `nextReviewDate`;
- AgendaItems são compromissos materializados;
- Agenda virtual acumula atrasados.

---

## 3.12 AgendaItem

Decidido:

- AgendaItem é compromisso materializado;
- pode apontar para Card, Tema ou nenhum alvo;
- usa `targetType` + `targetId`;
- pode existir item livre sem target;
- estados oficiais:
  - `pending`
  - `done`
  - `skipped`
  - `snoozed`
- termo técnico oficial: `snoozed`;
- label de interface: "adiado";
- `postponed` não deve ser usado;
- AgendaItem não substitui Agenda virtual de cards vencendo.

---

## 3.13 Capture

Decidido:

- Capture é entrada rápida sem fricção;
- Capture nasce sem Tema;
- Capture é criada por botão flutuante;
- Capture entra em inbox;
- Capture pode virar:
  - Tema;
  - Card;
  - AgendaItem;
  - item arquivado;
- na Fase 1 não há split;
- na Fase 1 não há undo;
- Capture convertida não é deletada;
- Capture não gera revisão VRVS 3P.

---

## 3.14 Hub Diário

Decidido:

- Hub Diário é visão derivada;
- não deve duplicar dados;
- reorganiza dados vindos de outras entidades;
- não deve virar store próprio de conteúdo.

---

## 3.15 Backup, restore e migração

Decidido:

- backup entra na Fase 1;
- haverá backup global;
- haverá backup por Profile;
- `BackupMetadata` registra histórico de backups;
- arquivo real de backup não vive dentro do IndexedDB;
- restore seguro tem hierarquia:

1. restaurar como novo Profile — padrão;
2. substituir Profile existente — destrutivo, com confirmação forte;
3. merge inteligente — Fase 2.

Regra congelada:

- operação destrutiva nunca deve ser o caminho padrão.

---

## 3.16 Soft delete

Decidido:

- soft delete é o padrão;
- arquivamento usa `archivedAt`;
- hard delete é exceção;
- hard delete só deve existir quando não houver referências ou em operação avançada explícita;
- nenhuma cascata destrutiva silenciosa é permitida.

Exceções já aceitas:

- CardReview não tem soft delete;
- AgendaItem ativo sem alvo válido pode ser removido/cancelado porque intenção futura sem alvo perdeu sentido.

---

## 3.17 IDs

Decidido:

- IDs são gerados no cliente;
- IDs são estáveis;
- IDs são imutáveis;
- mover entidade entre containers não muda o ID;
- formato recomendado pelo SCHEMA: ULID com prefixo por entidade.

---

## 3.18 Métricas

Decidido:

- métricas devem ser derivadas sempre que possível;
- não persistir métricas históricas como fonte de verdade;
- fontes principais:
  - Sessões;
  - CardReviews;
  - Cards;
  - Temas;
- caches de performance podem existir, mas não substituem fonte de verdade.

---

## 3.19 VRVS 3P

Decidido:

- VRVS 3P é preservado;
- algoritmo opera sobre Cards;
- Tema não tem algoritmo próprio de revisão;
- revisão de Cards gera Sessão tipo `review`;
- CardReviews preservam o histórico do algoritmo.

---

# 4. Apostas provisórias aceitas

As decisões abaixo estão aceitas como direção provisória, mas podem ser refinadas na `ARQUITETURA_FASE_1.md`.

Não tratar como fato definitivo sem validação posterior.

## 4.1 Comportamento fino de Tema `paused`

Aposta aceita:

- Tema `paused` suspende cards da Agenda virtual;
- AgendaItems pendentes podem ficar suspensos visualmente sem serem cancelados;
- Tema continua vivo e acessível.

Refinar na arquitetura da Fase 1.

---

## 4.2 Comportamento fino de Tema `mastered`

Aposta aceita:

- Tema `mastered` suspende revisões ativas;
- Tema some da Agenda do dia;
- continua acessível em filtro apropriado;
- revisão de manutenção eventual pode ser Fase 2.

Refinar na arquitetura da Fase 1.

---

## 4.3 Transição `not_started → mastered`

Aposta aceita:

- não permitir `not_started → mastered` diretamente;
- exigir passagem por `in_study`.

Motivo provisório:
- mantém coerência pedagógica;
- simplifica análise de funil.

Pode ser reavaliado se criar atrito real.

---

## 4.4 `snoozeHistory[]`

Aposta aceita:

- adiar AgendaItem altera `scheduledDate` no mesmo registro;
- histórico de adiamentos pode existir como campo auxiliar, se útil.

Ainda não congelado como obrigatório.

Refinar na arquitetura da Fase 1 ou no próximo schema se for adotado.

---

## 4.5 UI da Sessão Livre pendente

Aposta aceita:

- Sessão Livre deve ser sinalizada como pendente;
- não deve ser escondida;
- não deve constranger o usuário;
- deve convidar à associação futura.

Refinar em `ARQUITETURA_FASE_1.md`.

---

## 4.6 Tema visual global ou por perfil

Aposta aceita:

- tema visual pode ficar global em `AppSettings`;
- ou pode ser por perfil em `Profile.preferences`;
- decisão final depende da arquitetura de UI.

Não congelado.

---

# 5. Pontos em aberto para ARQUITETURA_FASE_1.md

Estes pontos não bloqueiam o fechamento da Fase 0, mas precisam ser definidos antes de implementação.

## 5.1 Tela Agenda

Definir:

- composição exata da Agenda;
- ordem entre:
  - cards vencendo;
  - AgendaItems materializados;
  - itens atrasados;
  - itens adiados;
- comportamento visual de atraso;
- como mostrar cards derivados sem materializar tudo.

---

## 5.2 Sessão Livre

Definir:

- onde aparece;
- como sinalizar `pendingAssociation`;
- como associar depois a um Tema;
- se entra ou não em métricas gerais antes de associar;
- como filtrar Sessões Livres.

---

## 5.3 Status do Tema na UI

Definir:

- labels em português;
- botões de transição;
- filtros;
- efeito visual de `paused` e `mastered`;
- diferença clara entre status e arquivamento.

---

## 5.4 Capture Inbox

Definir:

- localização da inbox;
- fluxo de conversão;
- confirmação ao converter;
- como exibir Capture já convertida;
- como arquivar Capture.

---

## 5.5 Backup e restore

Definir:

- telas;
- linguagem de aviso;
- fluxo de restore como novo Profile;
- fluxo destrutivo de substituir Profile;
- confirmação forte;
- onde fica o backup automático pré-substituição;
- checklist de validação no iPhone.

---

## 5.6 Hub Diário

Definir:

- quais dados agrega;
- o que aparece no topo;
- relação com Agenda;
- relação com Sessões;
- relação com métricas;
- garantir que não duplique dados.

---

## 5.7 Manutenção futura

Definir se entra ou não na Fase 1:

- recalcular estado dos Cards;
- validar integridade;
- detectar órfãos;
- exportar diagnóstico simples.

Por padrão, manutenção avançada fica para depois, salvo se for necessária para segurança.

---

# 6. Fase futura

Não entra na Fase 1:

- Note como entidade própria;
- Reminder como entidade própria;
- tags/labels transversais;
- sync entre dispositivos;
- merge inteligente de backups;
- algoritmo avançado de manutenção;
- revisão de manutenção automática para Temas `mastered`;
- split/undo de Capture;
- movimentação automática entre Profiles;
- hard delete amplo;
- qualquer backend obrigatório.

---

# 7. O que NÃO deve ser reaberto sem motivo forte

Não reabrir:

- reconstrução do zero;
- repo novo separado;
- IndexedDB como persistência principal;
- sem backend obrigatório;
- mobile-first iPhone Safari;
- multi-perfil isolado por `profileId`;
- `activeProfileId` como perfil operacional;
- Tema como centro;
- Capture como entrada flexível;
- Card obrigatório em Tema;
- CardReview imutável;
- modelo híbrido de Card;
- Agenda como módulo central;
- Hub Diário como visão derivada;
- backup global e por perfil na Fase 1;
- restore como novo Profile por padrão;
- soft delete como padrão;
- IDs estáveis;
- métricas derivadas;
- VRVS 3P preservado;
- estabilidade maior que novidade.

Só reabrir se houver:
- contradição técnica real;
- risco grave de perda de dados;
- incompatibilidade forte com iPhone Safari/PWA;
- decisão que impeça evolução futura importante.

---

# 8. Relação com o legado

O legado não é base da reconstrução.

Ele serve para:

- identificar erros a evitar;
- entender fluxos que funcionavam;
- preservar aprendizados de UX;
- mapear riscos de perfil, diário, storage e cache.

Não serve para:

- copiar arquitetura;
- justificar localStorage na nova versão;
- manter monolito como obrigação;
- transformar bug antigo em decisão nova;
- preservar compatibilidade a qualquer custo.

A nova VRVS prioriza arquitetura limpa e segurança de dados.

---

# 9. Ordem obrigatória dos próximos passos

Ordem já definida:

1. `MODELO_DE_DADOS.md` — aprovado v1.1.
2. `DECISOES_FASE_0.md` — este documento.
3. `ARQUITETURA_FASE_1.md`
4. `PROTOCOLO_RECONSTRUCAO.md`
5. Só depois Cursor.

Cursor ainda não entra.

---

# 10. Próximo passo após este documento

Após aprovação deste `DECISOES_FASE_0.md`, o próximo documento é:

## `ARQUITETURA_FASE_1.md`

Objetivo:

Transformar as decisões conceituais e técnicas já aprovadas em uma arquitetura prática da primeira versão reconstruída da nova VRVS.

---

# 11. Estado final da Fase 0 até aqui

A Fase 0 já possui:

- base técnica: `SCHEMA_INDEXEDDB_v2.md`;
- base conceitual: `MODELO_DE_DADOS.md v1.1`;
- consolidação decisória: `DECISOES_FASE_0.md`.

Ainda falta:

- `ARQUITETURA_FASE_1.md`;
- `PROTOCOLO_RECONSTRUCAO.md`.

Sem esses dois, não há entrada do Cursor.

---

# Fim do documento
