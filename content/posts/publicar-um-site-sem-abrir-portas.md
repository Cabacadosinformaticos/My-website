---
title: Pôr um site na Internet sem abrir portas
desc: Como abri o IADE Horários ao público a partir de casa, sem abrir uma única porta no router, com um Cloudflare Tunnel e uma VM isolada. As três opções que pesei e porque escolhi a mais trabalhosa.
category: [Homelab, Redes, Segurança]
date: Set 2026
readTime: 9 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654843/cabacatech/2026-11/covers/posts/publicar-um-site-sem-abrir-portas-16ac02ae7a.webp
series: Diário do Homelab
seriesPart: 5
related: [project:iade-horarios, project:cabacalab, post:chega-o-bifrost]
---

Até setembro, tudo o que corria no meu homelab era privado: só existia dentro de casa e na minha rede Tailscale. Depois fiz o [IADE Horários](project-detail.html?id=iade-horarios), uma app para os meus colegas consultarem os horários das turmas e pela primeira vez precisei que pessoas de fora chegassem a um serviço meu.

A forma clássica de o fazer é abrir uma porta no router e apontá-la para o servidor. Não o fiz.

![Percurso de um pedido público pelo Cloudflare Tunnel até à VM da aplicação.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794662553/cabacatech/2026-11/diagrams/cloudflare-publication-84103ec235.webp)

## Primeiro problema: não dá para abrir portas

Mesmo que quisesse, a minha ligação está atrás de CGNAT: a operadora partilha o mesmo IP público entre vários clientes. Um pedido que chega a esse IP não sabe para que casa ir e o reencaminhamento de portas no meu router nunca o vê.

## Como funciona um túnel de saída

Um Cloudflare Tunnel inverte a direção da ligação. Em vez de a Internet ligar ao meu servidor, é o meu servidor que liga à Cloudflare e mantém essa ligação aberta. Quando alguém visita o site, o pedido chega à Cloudflare e desce pelo túnel que já existe.

```text title="com porta aberta vs com túnel"
Porta aberta:
  Internet  ->  router (porta 443)  ->  servidor
  qualquer pessoa pode bater à porta, a qualquer hora

Túnel:
  servidor  ->  Cloudflare           (ligação de saída, sempre aberta)
  Internet  ->  Cloudflare  ->  túnel  ->  servidor
  o router não tem nenhuma porta aberta
```

O router continua fechado. O IP de casa não aparece em lado nenhum. E a Cloudflare filtra o tráfego antes de ele chegar ao túnel.

## As três opções que pesei

O túnel resolve a entrada. A pergunta seguinte foi: onde é que o túnel acaba?

:::compare title="Onde terminar o túnel" left="Na VM das aplicações" right="Numa VM só para o site"
- Era o mais rápido: as apps já lá estavam
- Mas essa VM tem o painel de deploys e as chaves de acesso aos repositórios
- Uma falha no site exposto dava acesso a tudo isso
|||
- Mais trabalho: uma VM nova, configurada de raiz
- Só lá estão o container do site e o túnel
- Uma falha no site fica presa nessa VM
:::

A terceira opção, reencaminhar portas, estava fora por causa do CGNAT. Escolhi a VM dedicada.

:::decision title="Uma VM pública por projeto"
Cada site aberto à Internet tem a sua própria VM, com o seu túnel. Hoje são dois. Se um for comprometido, quem entrou encontra uma VM pequena com um container e mais nada.
:::

## Fechar a VM pública

Uma VM separada só vale alguma coisa se não conseguir falar com o resto. Ativei a firewall do Proxmox ao nível do datacenter e defini regras para que as VMs públicas:

- não consigam abrir ligações para as outras VMs do servidor, a não ser o estritamente necessário;
- não tenham Tailscale, para não ficarem dentro da minha rede privada;
- recebam os deploys a partir do painel e não o contrário.

Do lado da aplicação, o site liga-se à base de dados com um utilizador só de leitura e cada consulta tem um limite de 5 segundos. Mesmo que alguém encontre uma forma de abusar de uma pesquisa, não consegue alterar dados nem prender a base de dados.

:::stats
0 | Portas abertas no router
1 | VM por site público
5 s | Limite por consulta
:::

## O que ainda não está perfeito

A separação entre as VMs públicas e as privadas é feita pela firewall do Proxmox e não por uma rede separada (VLAN). Para o risco que tenho hoje é suficiente, mas o passo seguinte natural é tirar os serviços públicos do servidor principal de vez. É uma das razões para o [segundo servidor](blog-post.html?id=chega-o-bifrost).

## O que aprendi

- Não poder abrir portas foi uma vantagem. Um túnel de saída é mais seguro do que uma porta aberta bem configurada.
- O sítio onde o túnel acaba importa tanto como o túnel. A pergunta certa é "se isto for comprometido, a que é que dá acesso?".
- A proteção tem várias camadas: a Cloudflare à frente, uma VM isolada, uma firewall e um utilizador de base de dados sem permissões de escrita.
