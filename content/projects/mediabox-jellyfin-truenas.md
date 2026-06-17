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

## Arquitetura da MediaBox

A MediaBox tem uma função mais especializada do que o Servidorzinho. O host Proxmox serve como base, mas o interesse está nas duas camadas principais: media e storage.

```text title="visão lógica"
Lenovo ThinkPad M90Q
  -> Proxmox VE 9.2.1
       -> VM TrueNAS Scale
            -> Disco externo de 10 TB por passthrough USB
            -> Partilhas, permissões e datasets
       -> Serviço Jellyfin
            -> Biblioteca de media
            -> Transcodificação com Intel Quick Sync
```

O objetivo é que o Jellyfin consuma media a partir de storage organizado, e que a parte de storage esteja separada o suficiente para eu poder aprender TrueNAS sem misturar tudo diretamente no host.

:::warning title="Ainda é um setup em evolução"
Esta arquitetura ainda não é a versão final. A parte de NAS é experimental e existe para aprender, não para fingir que um disco USB único é uma solução profissional.
:::

## O que é transcoding na prática

Transcoding é o processo de converter um ficheiro de media para outro formato, resolução, bitrate ou codec enquanto ele está a ser reproduzido. Isto acontece quando o dispositivo cliente não consegue reproduzir o ficheiro original diretamente, ou quando a ligação disponível não aguenta o ficheiro original.

Exemplos simples:

| Situação | O que pode acontecer |
|---|---|
| TV não suporta o codec do ficheiro | Jellyfin converte para um formato compatível |
| Acesso remoto com pouca largura de banda | Jellyfin baixa bitrate ou resolução |
| Legendas obrigam a queimar texto no vídeo | Jellyfin gera uma nova stream com legendas |
| Cliente suporta o ficheiro original | Direct Play, sem transcoding |

O ideal é sempre Direct Play, porque o servidor quase não trabalha. Mas quando isso não é possível, Quick Sync evita que o CPU tenha de fazer tudo sozinho.

:::tip title="Objetivo de performance"
O melhor media server não é aquele que transcodifica tudo. É aquele que transcodifica quando precisa e faz Direct Play quando pode.
:::

## Jellyfin como serviço de media

Um dos serviços que mais queria montar era uma espécie de Netflix pessoal. Para isso escolhi Jellyfin, uma solução open source para organizar e ver filmes, séries, música, livros e outros conteúdos a partir da nossa própria infraestrutura.

:::resource title="Jellyfin" url="https://jellyfin.org/docs/"
Jellyfin é o serviço que estou a usar para gerir e reproduzir a minha biblioteca de media.
:::

A parte boa é a liberdade: não há subscrições, não há catálogo a desaparecer de um mês para o outro e os dados ficam em casa. A parte menos boa é que tudo passa a ser responsabilidade minha: instalação, configuração, troubleshooting, storage, backups e organização.

:::image-placeholder title="Dashboard do Jellyfin" desc="Screenshot do Jellyfin com biblioteca de teste ou dados privados ocultados." ratio="16:9"
:::

## Organização do Jellyfin

O Jellyfin depende muito da organização dos ficheiros. A tecnologia ajuda, mas se a biblioteca estiver caótica, a experiência fica má. O plano é separar bibliotecas por tipo de conteúdo e manter nomes previsíveis.

Um modelo simples seria:

```text title="estrutura de media"
/media
  /filmes
    /Nome do Filme (Ano)
      Nome do Filme (Ano).mkv
  /series
    /Nome da Serie
      /Season 01
        Nome da Serie S01E01.mkv
  /musica
  /livros
```

Isto facilita o scraping de metadata, evita falsos positivos e torna mais simples migrar ou reconstruir a biblioteca se for preciso.

Também quero separar a biblioteca de media dos dados internos do Jellyfin. Os ficheiros de media devem estar no storage partilhado. A configuração do Jellyfin, utilizadores, metadata e cache devem ser tratados como dados de aplicação.

## Quick Sync e limites reais

Ter Intel Quick Sync não significa que tudo fica automaticamente perfeito. Há várias coisas que influenciam a performance:

- Codec de origem e destino.
- Resolução, especialmente 4K.
- Bitrate do ficheiro original.
- Legendas, sobretudo quando precisam de ser queimadas no vídeo.
- Número de streams ao mesmo tempo.
- Velocidade do storage.
- Rede entre cliente, Jellyfin e ficheiros.

A iGPU ajuda imenso, mas não elimina a necessidade de escolher formatos razoáveis e perceber quando o servidor está a fazer Direct Play ou Transcode.

:::image-placeholder title="Jellyfin com informação de playback" desc="Screenshot de uma reprodução onde se veja Direct Play ou Transcode, com nomes de ficheiros ocultados." ratio="16:9"
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

## Limitações do disco USB

O disco externo resolveu o problema de entrada, mas trouxe limitações técnicas claras:

| Limitação | Porque importa |
|---|---|
| Sem redundância | Se o disco falhar, os dados vão com ele |
| Ligação USB | Pode ser menos estável do que SATA ou SAS |
| Um único disco | Sem distribuição de carga entre discos |
| Caixa externa | Mais uma fonte, cabo e ponto físico de falha |
| Crescimento limitado | Quando encher, a expansão não é elegante |

Para experimentar, serve. Para dados únicos e importantes, não chega. A diferença entre "storage grande" e "storage seguro" é uma das lições mais importantes deste projeto.

:::danger title="Capacidade não é resiliência"
10 TB parecem muito, mas continuam a ser um único ponto de falha. Um disco grande sem backup é só uma perda grande à espera de acontecer.
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

## Passthrough do disco

A ideia do passthrough é dar à VM acesso direto ao disco externo, em vez de criar um disco virtual por cima do storage do Proxmox. Isto é importante porque o TrueNAS deve gerir o storage que vai servir.

O modelo conceptual é:

```text title="storage path"
Disco USB 10 TB
  -> Proxmox identifica o dispositivo
       -> Dispositivo passado para a VM TrueNAS
            -> TrueNAS cria pool e datasets
                 -> Partilhas para serviços e utilizadores
```

Isto evita uma camada desnecessária de abstração, mas não transforma USB numa ligação ideal. O TrueNAS pode gerir o disco, mas continua dependente da estabilidade física e lógica da ligação USB.

:::warning title="Passthrough não remove o risco do USB"
Passar o disco diretamente para a VM melhora o controlo do TrueNAS sobre o dispositivo, mas a ligação continua a ser USB. Cabo, caixa externa e energia continuam a importar.
:::

## Datasets, permissões e partilhas

Ainda estou a explorar esta parte, mas a estrutura que faz sentido é separar dados por uso. Não quero uma única pasta gigante onde tudo vive ao mesmo nível.

Um modelo possível:

```text title="datasets planeados"
pool_media
  /media
    /filmes
    /series
    /musica
  /backups
  /transferencias
  /testes
```

Esta separação ajuda em permissões, snapshots, limpeza e futuras migrações. A pasta de media pode ter regras diferentes da pasta de backups. Uma área de testes pode ser apagada sem tocar no resto.

As permissões são a parte onde quero ter mais cuidado. É fácil resolver tudo com permissões largas, mas isso cria problemas quando vários serviços ou utilizadores começam a escrever no mesmo storage.

:::tip title="Organização antes de automação"
Antes de automatizar downloads, renames ou imports, quero garantir que datasets e permissões fazem sentido. Automação por cima de storage mal organizado só espalha a confusão mais depressa.
:::

## Cuidados físicos

O disco e o servidor estão num local separado e estável. Uma das minhas preocupações era vibração. Discos mecânicos modernos são bastante resistentes, mas continuam a ser dispositivos físicos com peças móveis.

O disco tem fonte própria, não depende da alimentação USB, e está ligado a uma porta SuperSpeed do M90Q. Antes de começar a usar, fiz testes de velocidade dentro do Proxmox para confirmar que a ligação era suficiente para o uso pretendido.

## Pontos de monitorização

Para este servidor, as métricas que me interessam são diferentes das do Servidorzinho:

| Área | O que observar |
|---|---|
| CPU | Picos quando há transcode sem aceleração |
| iGPU | Se Quick Sync está realmente a ser usado |
| RAM | Cache do TrueNAS e consumo do Jellyfin |
| Disco USB | Erros, desconexões e performance |
| Rede | Throughput ao servir ficheiros grandes |
| Storage livre | Crescimento da biblioteca |

Se o Jellyfin estiver lento, a causa pode não ser o Jellyfin. Pode ser transcode em CPU, storage lento, rede fraca, metadata a atualizar ou permissões erradas no caminho da biblioteca.

## Estado atual

Neste momento, a MediaBox tem duas frentes principais:

- A VM do TrueNAS Scale, usada para aprender e gerir storage.
- O Jellyfin, ainda numa fase inicial de montagem e organização.

O objetivo não é fingir que isto é uma solução final perfeita. O objetivo é aprender como estas peças funcionam, perceber onde estão os riscos e evoluir o setup à medida que a biblioteca e as necessidades crescerem.

## Próximos passos

Quero explorar melhor permissões, organização de datasets, automação de media, backups e integração com Jellyfin. Também quero perceber até onde esta solução USB aguenta antes de justificar uma NAS mais séria.

A MediaBox é, acima de tudo, um laboratório de media e storage. Tem partes pouco convencionais, mas é precisamente por isso que está a ensinar tanto.
