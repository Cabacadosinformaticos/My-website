---
title: PSP Lisboa App
desc: Aplicação Android nativa feita em 48 horas no Tech Jam Tech4Good 2026 do IADE, em resposta a um desafio real da PSP. Ajuda os cidadãos a encontrar a esquadra certa para cada serviço, entre 120 esquadras da área metropolitana de Lisboa.
category: [Android, Mobile, Tech Jam]
year: 2026
type: Tech Jam
duration: 48 horas
status: Concluído
stack: [Kotlin, Android, Material Design 3, Firebase, Google Maps SDK]
cover: ""
related: [project:xplored, post:ola-mundo, project:africana-virtual-airways]
---

O PSP Lisboa App foi construído em 48 horas durante o Tech4Good 2026, o Tech Jam organizado pelo IADE no campus de Moscavide, em que equipas de estudantes respondem a desafios sociais reais. A nossa equipa de sete pessoas escolheu o desafio proposto pela Polícia de Segurança Pública: facilitar o acesso dos cidadãos à PSP na área de Lisboa.

Fui Lead Developer e UI/UX Designer.

:::image-placeholder title="Ecrãs da app" desc="Carrossel com os screenshots reais: início, mapa, detalhe de esquadra, guia de serviços, categorias e lista de esquadras." ratio="16:9"
:::

## O que nos pediram

O desafio vinha do Comando Metropolitano de Lisboa (COMETLIS), que gere 120 esquadras organizadas em divisões territoriais, de trânsito, de investigação criminal, de segurança de instalações e de transportes públicos. A PSP trabalha em 13 áreas de serviço, do policiamento de proximidade ao licenciamento de armas e aos objetos perdidos.

O pedido era desenvolver uma app que facilitasse o acesso dos cidadãos à PSP na área de Lisboa, e trazia duas exigências concretas:

- **Geolocalização**: mostrar a esquadra mais próxima e guiar o cidadão até lá.
- **Filtro por serviço**: saber que esquadra trata de trânsito, de armas, de perdidos e achados, e de cada um dos outros serviços.

O impacto esperado também era claro: menos tempo perdido e menos idas à esquadra errada. O júri avaliava impacto social, inovação, qualidade técnica, usabilidade, sustentabilidade, qualidade da apresentação e viabilidade. Tivemos uma apresentação intermédia aos mentores no sábado, a entrega final no domingo às 14h e as apresentações finais às 15h.

:::stats
48 h | Do zero à demo
120 | Esquadras no mapa
13 | Categorias de serviço
7 | Pessoas na equipa
:::

## Da pergunta à ideia

<!-- REVER (Tiago): esta secção foi escrita a partir do enquadramento do pitch. Acrescentar o que a equipa discutiu e descartou durante o evento. -->

Antes de pensar em ecrãs, reduzimos o desafio à pergunta que o cidadão faz quando precisa da polícia para alguma coisa que não é uma emergência: **onde é que devo ir?** Com 120 estruturas e 13 áreas de serviço, a resposta não é óbvia, e a informação existia mas estava espalhada.

A partir daí, a app organizou-se num fluxo de três passos, que foi também a espinha do nosso pitch:

:::timeline
1 | Descobrir | O ecrã inicial mostra logo a esquadra mais próxima, uma pesquisa e atalhos para os serviços mais procurados. Sem menus antes de chegar à informação.
2 | Filtrar | No mapa ou no guia de serviços, o cidadão reduz as 120 esquadras às que tratam do que precisa, ou às que estão abertas 24 horas.
3 | Agir | A ficha da esquadra tem horários, telefone, morada e direções. A escolha passa a ação com um toque.
:::

Tudo o que não servia esta pergunta ficou em segundo plano. As funcionalidades de conta, notificações e documentos digitais entraram como protótipo, para mostrar à PSP até onde a app podia crescer, sem roubar tempo ao fluxo principal.

## O que a app faz

- **Mapa** com as 120 esquadras e filtros: todas, abertas 24 horas, a mais próxima, territoriais, divisões.
- **Detalhe de cada esquadra**: fotografias, horários, contactos, morada e direções, num painel por cima do mapa.
- **Guia de serviços** com 13 categorias e artigos, cada uma com as esquadras que a prestam.
- **Pesquisa única** sobre esquadras, categorias e artigos.
- **Conta de utilizador** com Firebase, notificações em 4 tipos (informação, aviso, sucesso e alerta) e um ecrã de participações.
- **Protótipo de documentos digitais**: réplicas simuladas do Cartão de Cidadão e da Carta de Condução, para mostrar à PSP como essa funcionalidade poderia ser. Não guarda documentos reais.

## O meu trabalho

Como Lead Developer, a minha responsabilidade foi a parte técnica do princípio ao fim: decidir a estrutura da app, dividir o trabalho pelas sete pessoas de forma a que ninguém ficasse bloqueado à espera de outro, e garantir que no fim do fim de semana tudo encaixava numa demo que funcionava. Como UI/UX Designer, desenhei os ecrãs e o fluxo de navegação, a pensar em quem abre a app com pressa e só quer saber onde ir.

Um dos desafios mais interessantes foi a informação das esquadras. Usámos duas fontes: o Google Places, com localização, fotografias, horários e contactos, e a informação pública da própria PSP, com o tipo de unidade e os serviços de cada esquadra. As duas não usam os mesmos identificadores, por isso foi preciso reconhecer que dois registos diferentes eram a mesma esquadra antes de os juntar numa só ficha.

O outro foi a velocidade. Pedir os dados de 120 esquadras à rede sempre que o mapa abre não funciona numa demo, nem na rua com rede fraca. A app guarda os dados já obtidos e só os volta a pedir quando ficam antigos, o que permite abrir o mapa de imediato e filtrar os marcadores sem esperar.

A app foi feita em Kotlin, com Material Design 3, Firebase para as contas e o Google Maps para o mapa.

:::callout title="Sobre os detalhes técnicos"
O projeto respondeu a um desafio real da PSP e pode ter continuidade. Por isso esta página fala do trabalho e das funcionalidades, e não da implementação.
:::

## Decisões tomadas contra o relógio

:::decision title="Usar o que a equipa domina"
Num Tech Jam de 48 horas, a ferramenta certa é a que a equipa conhece e que não surpreende. Escolhemos tecnologias Android maduras em vez de experimentar novidades a meio do fim de semana.
:::

:::decision title="O detalhe da esquadra fica por cima do mapa"
Abrir o detalhe num ecrã novo fazia perder a posição e o zoom do mapa. Num painel sobreposto, fechar o detalhe devolve o utilizador exatamente onde estava.
:::

## O que propusemos a seguir

No fecho do pitch deixámos um caminho para a app passar de protótipo a serviço:

1. Validar o fluxo com cidadãos reais.
2. Completar a informação oficial de todas as esquadras e serviços.
3. Um piloto com notificações e estados reais das participações.

E algumas ideias para mais tarde: notificações mais ricas, a ocupação das esquadras em tempo real e a ligação a plataformas nacionais de emergência.

## A equipa

Sete estudantes de Engenharia Informática e Creative Technologies do IADE:

| Pessoa | Papel |
|---|---|
| Tiago Cabaça | Lead Developer, UI/UX Designer |
| André Maleitas | Firebase e autenticação |
| Rodrigo Freire | Backend |
| Martim Conceição | Mapas e localização |
| César Oliveira | Frontend, QA e testes |
| Lucas Nicolau | Integração de APIs |
| Sara Santos | Design visual e branding |

## O que tirei disto

Em 48 horas não há tempo para hesitar. Cada decisão técnica tem de ser tomada em minutos, a divisão de trabalho tem de estar clara desde a primeira hora, e tudo o que não aparece na demo final fica para depois. Ter passado antes pelo [Xplored](project-detail.html?id=xplored) deu-me a base Android que tornou possível liderar a parte técnica neste tempo.

Os projetos foram avaliados pelo impacto social, inovação, qualidade técnica, usabilidade e sustentabilidade.
