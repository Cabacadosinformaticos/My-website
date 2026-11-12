---
title: Agendar pedidos de diário com restrições
desc: Como o agendador do Fieldnote escolhe horários, distribui a carga e devolve um plano parcial quando precisa. Com os resultados de uma demonstração e da avaliação.
category: [Algoritmos, Python, Sistemas Distribuídos]
date: Nov 2026
readTime: 6 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654834/cabacatech/2026-11/covers/posts/fieldnote-agendar-sem-interromper-cdb3c9320e.webp
related: [project:fieldnote, post:fieldnote-quando-um-no-falha]
---

O agendador do Fieldnote escolhe quando pedir um registo a cada participante. Usa a disponibilidade declarada, as janelas das atividades e os limites do estudo. Constrói um plano com horários válidos e deixa explícitos os pedidos que não conseguiu colocar.

O investigador define as regras do estudo e cada participante indica quando está disponível. O agendador transforma essa informação num calendário diário. Trabalha com disponibilidade declarada, pelo que o resultado representa horários compatíveis com essas regras, sem tentar adivinhar o contexto do telemóvel.

![Definição das atividades no dashboard real do Fieldnote, com dados de demonstração e identidade ocultada.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794514028/cabacatech/2026-11/screenshots/fieldnote/fieldnote-portal-activities-a6aec4516a.webp)

## Cada pedido é uma variável

Modelámos o dia como um problema de satisfação de restrições, ou CSP. Cada combinação de participante, atividade e ocorrência é uma variável. Se uma atividade pede dois registos por dia, cria duas variáveis para cada participante.

O domínio é o conjunto dos horários permitidos em intervalos de 15 minutos. A janela da atividade cruza-se com a disponibilidade da pessoa. Entre as 08:00 e as 22:00 cabem 56 intervalos, mas cada participante pode ter apenas uma parte deles.

As restrições impõem um intervalo mínimo entre pedidos à mesma pessoa, um máximo diário por participante e um máximo de pedidos por intervalo para o estudo. Quando duas atividades têm intervalos mínimos diferentes, aplica-se o maior.

Acrescentámos a cada domínio o valor «não planeado», representado por ⊥. Assim, mesmo um dia impossível de preencher por completo tem uma resposta válida. A comparação entre planos tem uma ordem: primeiro conta quantos pedidos conseguimos colocar. Só em caso de empate conta a preferência por variedade, rotina ou uma combinação das duas.

## Escolher por onde começar a pesquisa

O solver está escrito em Python, sem biblioteca de resolução. A pesquisa por backtracking experimenta uma atribuição, verifica as consequências e volta atrás quando precisa.

O forward checking remove, nas variáveis ainda por atribuir, os horários incompatíveis com uma escolha. A heurística MRV começa pela variável com menos horários disponíveis. A LCV tenta primeiro o horário que retira menos opções às outras variáveis. Um registo das alterações permite desfazê-las ao abandonar um ramo.

O branch and bound calcula quanto um ramo ainda pode alcançar. Se já não consegue melhorar o melhor plano encontrado, deixa de o explorar. Este corte usa a mesma ordem do objetivo: número de pedidos antes da pontuação.

A pesquisa tem um orçamento. Quando o esgota, devolve o melhor plano que encontrou e assinala que não provou a optimalidade. Um pedido ainda sem horário pode caber num ramo por explorar. A aplicação deve conservar essa distinção em vez de o apresentar como impossível.

## Preservar a escolha de deixar um pedido por planear

O valor ⊥ permite resolver conflitos sem invalidar o dia inteiro. Pensemos numa pessoa disponível numa janela curta. Se dois pedidos exigem mais distância do que essa janela permite, o solver pode colocar um e deixar o outro por planear. Continua a respeitar as restrições do estudo.

Esta escolha faz parte da pesquisa. O AC-3 identifica conflitos entre pares de pedidos e conserva os domínios, porque um pedido pode suportar o horário do outro ao assumir o valor ⊥. A pesquisa avalia as alternativas à luz do objetivo: colocar o maior número de pedidos e depois melhorar a pontuação.

Cada técnica tem, assim, uma função definida. O forward checking propaga as escolhas durante a pesquisa. MRV e LCV orientam a ordem. O branch and bound evita explorar ramos que já não podem melhorar o resultado. A ablação compara as variantes com o mesmo orçamento e torna visível o contributo de cada uma.

## Um vídeo pesa mais do que um texto

Limitar o número de pedidos ajuda a distribuir os envios, mas ignora o tipo de resposta. Introduzimos uma capacidade ponderada por intervalo: texto, escala e escolha valem 1; fotografia e áudio valem 2; vídeo vale 5. Uma atividade com vários tipos usa o peso do mais exigente.

Estes valores são unidades do modelo para distinguir o custo relativo dos tipos de resposta. A capacidade da plataforma tem o valor por defeito de 40 unidades por intervalo de 15 minutos.

O agendador soma também a carga que outros estudos já têm planeada. Resolve os estudos por ordem e os seguintes adaptam-se ao espaço restante. Esta coordenação é sequencial. Não procura o melhor plano conjunto de todos os estudos e não usa o tamanho atual da fila de processamento de media para decidir o dia seguinte.

## Demonstrar o algoritmo sem o cluster

Preparámos um notebook com dados gerados para mostrar o raciocínio. O exemplo começa com cinco participantes e três atividades, compara horários fixos com as técnicas de pesquisa e permite editar o problema. No exemplo guardado, a configuração com branch and bound termina com 19 pedidos planeados em 94 nós de pesquisa.

O notebook inclui simulações de carga e de troca de liderança. Essas células explicam mecanismos; não substituem os testes do servidor. Conservámos também uma página de demonstração que executa uma cópia do solver Python no browser através de Pyodide. A página permite percorrer uma execução ou gerar um estudo, mas precisa de Internet para carregar esse runtime.

## Ler os resultados com as condições ao lado

A avaliação guardada no repositório usa estudos gerados, seeds conhecidas e orçamentos iguais por comparação. Num caso de 100 participantes e quatro atividades, com seed 2026 e 20 000 nós, o solver colocou 332 pedidos. A baseline de horários iguais colocou 258 e violou restrições que ignora deliberadamente. A pesquisa do solver foi interrompida pelo orçamento, pelo que 332 é o melhor resultado encontrado nessa execução.

No mesmo caso, uma capacidade de 41 reduziu o pico ponderado de 82 para 41 sem reduzir os 332 pedidos. Já a comparação com pesquisa exaustiva usou 300 estudos pequenos, de 6 a 12 pedidos. O solver atingiu o ótimo nos 300, tanto na contagem como na pontuação.

Estes ensaios verificam a validade dos planos, a distribuição da carga e o esforço de pesquisa. Os dados gerados tornam a comparação reproduzível e permitem explorar configurações antes de as aplicar a um estudo. A avaliação da adesão e da experiência dos participantes pertence à fase de utilização, com um protocolo próprio. O investigador já dispõe de um mecanismo que respeita as regras declaradas e explica o estado de cada pedido.
