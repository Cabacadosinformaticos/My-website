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

## O desafio

O Comando Metropolitano de Lisboa gere 120 esquadras, organizadas em divisões territoriais, de trânsito, de investigação criminal, de segurança de instalações e de transportes públicos. A PSP trabalha em 13 áreas de serviço, do policiamento de proximidade ao licenciamento de armas e aos objetos perdidos.

O problema era concreto: quem precisa de ir à PSP muitas vezes não sabe a que esquadra ir, nem que serviços cada uma presta. Isso gera deslocações desnecessárias e tempo perdido, dos dois lados do balcão.

:::stats
48 h | Do zero à demo
120 | Esquadras no mapa
13 | Categorias de serviço
7 | Pessoas na equipa
:::

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

## A equipa

Sete estudantes de Engenharia Informática e Creative Technologies do IADE:

| Pessoa | Papel |
|---|---|
| Tiago Cabaça | Lead Developer, UI/UX Designer |
| André Maleitas | Firebase e autenticação |
| Rodrigo Freire | Backend |
| Martim Conceição | Mapas e localização |
| César Rodrigues | Frontend, QA e testes |
| Lucas Nicolau | Integração de APIs |
| Sara Santos | Design visual e branding |

## O que tirei disto

Em 48 horas não há tempo para hesitar. Cada decisão técnica tem de ser tomada em minutos, a divisão de trabalho tem de estar clara desde a primeira hora, e tudo o que não aparece na demo final fica para depois. Ter passado antes pelo [Xplored](project-detail.html?id=xplored) deu-me a base Android que tornou possível liderar a parte técnica neste tempo.

Os projetos foram avaliados pelo impacto social, inovação, qualidade técnica, usabilidade e sustentabilidade.
