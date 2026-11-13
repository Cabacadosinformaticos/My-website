---
title: Agendar pedidos de diário com restrições
desc: Como o agendador do Fieldnote escolhe horários, distribui a carga e devolve um plano parcial quando precisa. Com os resultados de uma demonstração e da avaliação.
category: [Algoritmos, Python, Sistemas Distribuídos]
date: Nov 2026
readTime: 6 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654834/cabacatech/2026-11/covers/posts/fieldnote-agendar-sem-interromper-cdb3c9320e.webp
related: [project:fieldnote, post:fieldnote-quando-um-no-falha]
---

No Fieldnote, o investigador define atividades e cada participante diz quando está disponível. O agendador junta as duas coisas e decide a que horas pedir cada registo. Respeita as janelas das atividades e os limites do estudo. O que não consegue colocar fica marcado como não planeado, em vez de desaparecer.

Trabalha só com a disponibilidade declarada. Não tenta adivinhar o que a pessoa está a fazer com o telemóvel na mão.

![Definição das atividades no dashboard real do Fieldnote, com dados de demonstração e identidade ocultada.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794514028/cabacatech/2026-11/screenshots/fieldnote/fieldnote-portal-activities-a6aec4516a.webp)

## Cada pedido é uma variável

Modelámos o dia como um problema de satisfação de restrições (CSP). Cada combinação de participante, atividade e ocorrência é uma variável. Uma atividade que pede dois registos por dia gera duas variáveis por participante.

O domínio de cada variável são os horários permitidos, em intervalos de 15 minutos: a janela da atividade cruzada com a disponibilidade da pessoa. Entre as 08:00 e as 22:00 cabem 56 intervalos, mas uma pessoa raramente está livre em todos.

As restrições são três: um intervalo mínimo entre pedidos à mesma pessoa, um máximo diário por participante e um máximo de pedidos por intervalo em todo o estudo. Quando duas atividades têm intervalos mínimos diferentes, vale o maior.

A cada domínio acrescentámos o valor «não planeado», que escrevemos ⊥. Com ele, um dia impossível de preencher por completo continua a ter uma resposta válida. Dois planos comparam-se por ordem: ganha o que coloca mais pedidos. Só em caso de empate conta a preferência por variedade, rotina ou uma mistura das duas.

## A pesquisa

O solver é Python sem biblioteca de resolução. Faz backtracking: experimenta um horário, vê o que isso tira às outras variáveis e volta atrás quando chega a um beco.

O forward checking apaga, nas variáveis ainda por atribuir, os horários que deixaram de servir. A heurística MRV começa pela variável com menos horários livres. A LCV experimenta primeiro o horário que tira menos opções às outras. Um registo das alterações permite desfazê-las ao abandonar um ramo. O branch and bound calcula o que um ramo ainda pode render e abandona-o se já não bate o melhor plano encontrado. O corte usa a mesma ordem do objetivo: pedidos primeiro, pontuação depois.

A pesquisa tem um orçamento de nós. Quando o esgota, devolve o melhor plano que tem e diz que não provou que é o ótimo. Um pedido sem horário nesse plano pode caber num ramo que ficou por explorar. A aplicação tem de manter essa distinção e não o apresentar como impossível.

O AC-3 tem aqui um papel pequeno. Deteta pares de pedidos em conflito, mas não corta nenhum horário. Cortar seria errado por causa do ⊥: um pedido que parece não ter horário compatível com o do outro pode ficar a salvo se o outro for para ⊥. Quem decide quem fica por planear é a pesquisa, à luz do objetivo. Na tabela da ablação, a linha «+ AC-3» dá exatamente os mesmos números que «+ LCV».

Esse valor ⊥ faz diferença em casos pequenos. Uma pessoa só está livre numa janela curta e dois pedidos pedem mais distância do que a janela dá. O solver coloca um, deixa o outro por planear e continua a cumprir todas as restrições do estudo.

## Um vídeo pesa mais do que um texto

Limitar o número de pedidos por intervalo distribui os envios mas ignora o tipo de resposta. Por isso o intervalo tem uma capacidade ponderada: texto, escala e escolha valem 1, fotografia e áudio valem 2, vídeo vale 5. Uma atividade com vários tipos usa o peso do mais pesado. A plataforma tem por defeito 40 unidades por intervalo de 15 minutos.

O agendador soma também a carga que outros estudos já têm planeada. Resolve os estudos um a um e os seguintes adaptam-se ao espaço que sobra. Não procura o melhor plano conjunto de todos os estudos. Também não olha para o tamanho da fila de processamento de media para decidir o dia seguinte.

## Demonstrar o algoritmo sem o cluster

Preparámos um notebook com dados gerados. Começa com cinco participantes e três atividades, compara horários fixos com as técnicas de pesquisa e deixa editar o problema. No exemplo guardado, a configuração com branch and bound planeia 19 pedidos em 94 nós. O notebook tem ainda simulações de carga e de troca de líder, que explicam os mecanismos mas não substituem os testes do servidor.

Há também uma página de demonstração que corre uma cópia do solver no browser através de Pyodide. Percorre uma execução ou gera um estudo, mas precisa de Internet para carregar o Pyodide.

## Os números

A avaliação está no repositório, com estudos gerados, seeds conhecidas e o mesmo orçamento em cada comparação. Num caso de 100 participantes e quatro atividades, com seed 2026 e 20 000 nós, o solver colocou 332 pedidos. A baseline de horários iguais colocou 258 e ainda violou restrições que ignora de propósito. A pesquisa do solver parou no orçamento, por isso 332 é o melhor resultado encontrado nessa execução e não um ótimo provado.

No mesmo caso, uma capacidade de 41 baixou o pico ponderado de 82 para 41 sem perder nenhum dos 332 pedidos.

Os resultados de uma seed enganam. Noutra bateria, com cinco seeds, 100 participantes e 20 000 nós, o MRV colocou em média 271,6 pedidos e o LCV 278,6. O branch and bound manteve os 278,6 e subiu a pontuação média de 54,8 para 60,0.

Para saber se o solver chega ao ótimo, comparámo-lo com uma pesquisa exaustiva em 300 estudos pequenos, de 6 a 12 pedidos. Chegou ao ótimo nos 300, na contagem e na pontuação.

Estes ensaios verificam a validade dos planos, a distribuição da carga e o esforço de pesquisa. Não dizem nada sobre a adesão dos participantes, que só se mede com o estudo a decorrer e tem um protocolo próprio.
