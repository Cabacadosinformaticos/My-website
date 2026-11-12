---
title: IADE Horários
desc: Web app que transforma os horários públicos do IADE numa ferramenta de consulta por turma, sala, professor ou cadeira, com histórico de alterações e comparação de horários. A primeira aplicação a correr no meu homelab e aberta à Internet.
category: [Web App, Backend, Homelab]
year: 2026
type: Pessoal
duration: Set 2026, em evolução
status: Em produção
stack: [Python, FastAPI, PostgreSQL, JavaScript, Docker, Coolify, Cloudflare Tunnel]
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794513964/cabacatech/2026-11/covers/projects/iade-horarios-858f0ac746.webp
live: https://iade-horarios.cabacatech.com
related: [post:publicar-um-site-sem-abrir-portas, project:cabacalab, project:homelab-proxmox-servidorzinho]
---

Os horários das turmas do IADE são públicos, mas estão num site estático: uma página por turma, sem pesquisa, sem forma de saber que sala está livre e sem forma de perceber o que mudou desde a semana passada. O IADE Horários lê essas páginas, guarda-as numa base de dados com histórico e mostra-as de uma forma pensada para quem as usa: os estudantes.

:::callout title="Projeto pessoal"
O IADE Horários não é afiliado à instituição. Usa apenas informação que já é pública e respeita o site de origem: pede só o que mudou e espera entre pedidos.
:::

![Captura real da grelha semanal do IADE Horários em modo escuro.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794514020/cabacatech/2026-11/screenshots/iade-horarios/iade-week-dark-6c0c1c59ba.webp)

## O que faz

- Consulta por **turma, sala, professor ou cadeira**, com pesquisa que tolera acentos.
- **Sobreposição** de vários horários na mesma grelha, para comparar turmas ou encontrar uma hora livre em comum.
- **Salas livres** num dado momento.
- **Histórico de alterações**: o que mudou, quando e a diferença entre versões.
- **Viagem no tempo**: ver qualquer horário tal como estava num dia do passado, desde 11 de setembro de 2026.

:::stats
754 | Páginas lidas na primeira recolha
142 | Turmas
4213 | Aulas registadas
4 min | Recolha completa
:::

## Como funciona

O sistema tem duas partes que partilham a base de dados: um scraper que recolhe e um site que mostra.

### A recolha

O scraper corre de 6 em 6 horas. Em cada página envia os cabeçalhos `If-None-Match` e `If-Modified-Since` e o servidor do IADE responde `304 Not Modified` quando nada mudou. Na segunda recolha completa, todas as páginas responderam 304: o scraper quase não gera tráfego quando os horários estão estáveis. Entre pedidos há uma pausa de 0,3 segundos.

Cada página é uma grelha de meia em meia hora, em que a duração de uma aula vem do `rowspan` da célula. O parser converte a grelha numa lista de aulas, ordena-a e calcula um hash. Só quando o hash muda é que se guarda uma versão nova. É assim que o histórico existe sem guardar 754 cópias iguais a cada 6 horas.

```text title="modelo de dados"
classes          -> turmas e outros períodos
periods          -> um horário (turma + semestre)
period_versions  -> cada versão diferente desse horário, com data
lessons          -> as aulas de cada versão
runs             -> registo de cada recolha
lessons_current  -> vista com a versão mais recente de tudo
```

### O site

FastAPI, um template Jinja e JavaScript sem framework para a grelha. Escolhi Python para o scraper e para o site para ter uma só linguagem, um só runtime e um só repositório. SvelteKit ou Next.js trariam uma segunda linguagem e um passo de build que este projeto não precisa.

O site tem 14 rotas, todas de leitura: 8 páginas e 6 endpoints de API, com SQL parametrizado. A ligação à base de dados usa um utilizador só de leitura, com um limite de 5 segundos por consulta.

## Problemas que tive de resolver

:::details title="A primeira recolha marcou todas as turmas como desaparecidas"
A página índice do site do IADE tem um bloco `<noframes>`. As versões recentes do Python tratam o conteúdo de `<noframes>` como texto puro, por isso o parser encontrou zero links e concluiu que todas as turmas tinham desaparecido. Corrigi o parser para remover as tags antes de procurar links e acrescentei uma proteção: se o índice devolver menos de 50 links, a recolha aborta sem tocar em nada. Um scraper que confia cegamente na página que leu acaba por destruir os próprios dados.
:::

:::details title="Aulas sobrepostas e blocos minúsculos no telemóvel"
Algumas turmas têm aulas ao mesmo tempo (desdobramentos, e-learning). Na primeira versão os blocos ficavam uns por cima dos outros e havia alvos de toque com menos de 44 px. Passei a posicionar os blocos de forma absoluta, com faixas paralelas para as sobreposições e testei a 375, 768 e 1280 px em modo claro e escuro. O contraste mínimo do texto principal ficou em 5,52:1.
:::

:::details title="Um ficheiro de configuração que não atualizava"
O Caddy continuava a servir a configuração antiga depois de um `git pull`. O Git substitui o ficheiro por um novo (novo inode) e o container continuava montado no antigo. A solução foi montar pastas em vez de ficheiros individuais.
:::

## Pôr o site na Internet

A primeira versão só existia dentro da minha rede privada. Para a abrir aos colegas, criei uma VM dedicada só para a parte pública, com um Cloudflare Tunnel e uma firewall própria: se alguém comprometer o site, não chega ao resto do servidor. Contei o processo e as alternativas que rejeitei num [post próprio](blog-post.html?id=publicar-um-site-sem-abrir-portas).

## O que aprendi

- Um scraper educado é fácil de fazer: pedidos condicionais e uma pausa resolvem quase tudo.
- Guardar versões com hash dá histórico quase de graça.
- Testar com screenshots reais, em vários tamanhos de ecrã, encontra problemas que nenhum teste unitário encontra.
- Publicar uma aplicação é metade do trabalho. A outra metade é decidir o que fica exposto e o que não fica.
