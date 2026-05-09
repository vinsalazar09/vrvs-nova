# ADENDO_FASE_1_ACUMULO_CARDS.md — Nova VRVS

**Status:** decisão complementar da Fase 1  
**Escopo:** comportamento da tela Hoje diante de acúmulo de Cards vencidos/atrasados.

---

# 1. Decisão

A tela Hoje não deve tratar acúmulo grande de Cards apenas com maquiagem visual.

A Fase 1 deve incluir um tratamento real mínimo para acúmulo:

1. cap visual no bloco "Pra agora";
2. agrupamento por idade do atraso;
3. ações em massa controladas.

---

# 2. Cap visual

Quando houver muitos Cards vencidos/atrasados, o bloco "Pra agora" não deve esmagar o usuário.

Regra inicial da Fase 1:

- sugerir até 10 Cards por vez no bloco "Pra agora";
- exibir também o total real pendente.

Exemplo:

"Revisar 10 agora"  
"80 pendentes no total"

Isso é regra de apresentação, não alteração do algoritmo VRVS 3P.

---

# 3. Agrupamento por idade

A tela Hoje deve permitir separar Cards atrasados por idade do atraso.

Agrupamentos iniciais sugeridos:

- vencem hoje;
- atrasados até 7 dias;
- atrasados de 8 a 30 dias;
- atrasados há mais de 30 dias.

A definição exata de labels e hierarquia visual pode receber refino de UX posterior.

---

# 4. Ações em massa controladas

A Fase 1 deve prever ações em massa para lidar com acúmulo.

Ações previstas:

1. revisar grupo;
2. adiar grupo;
3. resetar grupo.

Essas ações são delicadas e devem passar por PREVIEW específico antes de implementação.

Nenhuma ação em massa deve apagar CardReviews.

Nenhuma ação em massa deve quebrar histórico.

Nenhuma ação em massa deve alterar algoritmo sem decisão explícita.

---

# 5. Fase 2

Ficam para Fase 2:

- modo recuperação automático;
- revisão preguiçosa;
- nudges inteligentes;
- automações avançadas de limpeza de backlog.

---

# 6. Trava técnica

Parâmetros de comportamento devem ser ajustáveis sem reescrever lógica.

Exemplos:

- limite visual de Cards sugeridos;
- faixas de idade do atraso;
- comportamento de adiamento em massa;
- labels de grupos.

Esses parâmetros devem ser tratados como configuração/comportamento isolável, não hardcode espalhado pela UI.

---

# Fim do documento
