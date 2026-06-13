---
title: MediaBox
desc: Servidor compacto em Proxmox dedicado a media, Jellyfin, transcodificação por Intel Quick Sync e uma NAS experimental com TrueNAS Scale.
category: [Homelab, Media Server, NAS]
year: 2026
type: Pessoal
duration: Em evolução
status: Em desenvolvimento
stack: [Proxmox VE, Jellyfin, TrueNAS Scale, Intel Quick Sync, USB Storage]
cover: ""
---

A MediaBox é o segundo servidor do meu homelab. Chamo-lhe "secundário" às vezes, mas isso não é totalmente justo: ele não é menos importante, só tem uma função diferente.

Enquanto o Servidorzinho foi pensado para CPU, virtualização geral e Minecraft, a MediaBox foi escolhida para media. A peça central aqui é a capacidade de transcodificação por hardware através de Intel Quick Sync.

:::image-placeholder title="Foto da MediaBox" desc="Foto real do Lenovo ThinkPad M90Q com o disco externo ligado por USB." ratio="16:9"
:::

:::specs title="Hardware da MediaBox"
Máquina: Lenovo ThinkPad M90Q
CPU: Intel Core i5 14500T
GPU integrada: Intel UHD Graphics 770
RAM: 32 GB DDR5-5600 SO-DIMM
Storage interno: 512 GB Toshiba NVMe
Storage externo: Seagate Expansion 10 TB USB 3.2
Hypervisor: Proxmox VE 9.2.1
:::

## Porque existe um segundo servidor

O Servidorzinho tem muito processador, mas não foi pensado para vídeo. Para correr um serviço como o Jellyfin com transcodificação, uma iGPU Intel com Quick Sync faz uma diferença enorme.

O Intel Quick Sync permite codificar e descodificar vídeo por hardware usando a GPU integrada no processador. Na prática, isto significa que a MediaBox consegue converter vídeo para diferentes dispositivos sem depender tanto do CPU e sem precisar de uma gráfica dedicada.

:::resource title="Intel Video Processing Library" url="https://www.intel.com/content/www/us/en/developer/tools/vpl/overview.html"
Referência da Intel para processamento e aceleração de vídeo por hardware.
:::

:::decision title="Decisão técnica: separar media do servidor principal"
Separei a MediaBox porque vídeo e storage têm necessidades diferentes de um servidor de Minecraft. O Servidorzinho fica com serviços gerais e CPU. A MediaBox fica com transcodificação, ficheiros e experiências de NAS.
:::

## Jellyfin como serviço de media

Um dos serviços que mais queria montar era uma espécie de Netflix pessoal. Para isso escolhi Jellyfin, uma solução open source para organizar e ver filmes, séries, música, livros e outros conteúdos a partir da nossa própria infraestrutura.

:::resource title="Jellyfin" url="https://jellyfin.org/docs/"
Jellyfin é o serviço que estou a usar para gerir e reproduzir a minha biblioteca de media.
:::

A parte boa é a liberdade: não há subscrições, não há catálogo a desaparecer de um mês para o outro e os dados ficam em casa. A parte menos boa é que tudo passa a ser responsabilidade minha: instalação, configuração, troubleshooting, storage, backups e organização.

:::image-placeholder title="Dashboard do Jellyfin" desc="Screenshot do Jellyfin com biblioteca de teste ou dados privados ocultados." ratio="16:9"
:::

## O problema real: espaço

No início, storage parece sempre simples. Depois a biblioteca começa a crescer. Um filme pode ocupar 2 GB, outro 8 GB, outro 40 GB ou mais. Séries inteiras ocupam rapidamente centenas de gigabytes.

A escolha fica entre apagar coisas, comprar mais discos ou aceitar que isto vai crescer com o tempo. Como ninguém gosta de apagar a própria biblioteca, acabei por ir buscar um disco grande para começar a experimentar.

## A NAS pouco convencional

A parte de NAS da MediaBox é a mais experimental e a menos correta do ponto de vista técnico. Em vez de uma NAS dedicada, um conjunto de discos com redundância ou uma solução tipo Synology/QNAP, comecei com um disco externo USB de 10 TB.

O disco é um Seagate Expansion de 3.5 polegadas, com fonte própria e ligação USB 3.2. Não é a forma ideal de montar uma NAS, mas permitiu-me começar com menos custo e aprender a trabalhar com storage em rede.

:::danger title="Isto não é uma NAS recomendada para dados importantes"
Um único disco externo por USB não dá redundância e pode trazer riscos de corrupção, falhas de ligação ou perda de dados. Para dados importantes, isto deve ter backups e uma estratégia muito mais séria.
:::

:::image-placeholder title="Disco externo de 10 TB" desc="Foto do Seagate Expansion ligado à MediaBox, mostrando a ligação USB e fonte externa." ratio="4:3"
:::

## TrueNAS Scale em VM

Para gerir a parte de storage, criei uma VM com TrueNAS Scale. O disco externo é passado diretamente para a VM através de passthrough, ficando o TrueNAS responsável por partilhas, permissões, datasets e gestão do storage.

:::resource title="TrueNAS Community Edition" url="https://www.truenas.com/truenas-community-edition/"
Uso TrueNAS Scale para experimentar conceitos de NAS, partilhas, permissões e gestão de storage.
:::

:::specs title="VM do TrueNAS Scale"
Sistema: TrueNAS Scale
vCPU: 8 vCores
RAM: 16 GB
Disco do sistema: 32 GB
Storage de dados: Seagate Expansion 10 TB por passthrough USB
Função: NAS experimental
:::

A VM tem 16 GB de RAM porque o TrueNAS tira partido de memória para cache e porque o disco externo é mais lento do que uma solução interna bem montada. O disco virtual de 32 GB é só para o sistema. Os dados vivem no disco externo passado diretamente para a VM.

:::image-placeholder title="TrueNAS Scale" desc="Screenshot do TrueNAS com pools, shares e nomes sensíveis ocultados." ratio="16:9"
:::

## Cuidados físicos

O disco e o servidor estão num local separado e estável. Uma das minhas preocupações era vibração. Discos mecânicos modernos são bastante resistentes, mas continuam a ser dispositivos físicos com peças móveis.

O disco tem fonte própria, não depende da alimentação USB, e está ligado a uma porta SuperSpeed do M90Q. Antes de começar a usar, fiz testes de velocidade dentro do Proxmox para confirmar que a ligação era suficiente para o uso pretendido.

## Estado atual

Neste momento, a MediaBox tem duas frentes principais:

- A VM do TrueNAS Scale, usada para aprender e gerir storage.
- O Jellyfin, ainda numa fase inicial de montagem e organização.

O objetivo não é fingir que isto é uma solução final perfeita. O objetivo é aprender como estas peças funcionam, perceber onde estão os riscos e evoluir o setup à medida que a biblioteca e as necessidades crescerem.

## Próximos passos

Quero explorar melhor permissões, organização de datasets, automação de media, backups e integração com Jellyfin. Também quero perceber até onde esta solução USB aguenta antes de justificar uma NAS mais séria.

A MediaBox é, acima de tudo, um laboratório de media e storage. Tem partes pouco convencionais, mas é precisamente por isso que está a ensinar tanto.
