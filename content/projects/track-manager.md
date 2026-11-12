---
title: Track Manager
desc: Web app open source para gerir as faixas de áudio e legendas dos meus ficheiros de vídeo MKV e MP4, através de uma interface visual. Sem recomprimir o vídeo e sem linha de comandos.
category: [Web App, Ferramenta, Open Source]
year: 2026
type: Pessoal
duration: 12 dias
status: Concluído
github: https://github.com/Cabacadosinformaticos/Track-Manager
stack: [React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, dnd-kit, Python 3.12, FastAPI, FFmpeg, MKVToolNix]
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654856/cabacatech/2026-11/covers/projects/track-manager-86f8f5a919.webp
related: [post:como-este-site-foi-feito, project:iade-horarios]
---

Um ficheiro de vídeo MKV ou MP4 pode trazer várias faixas: áudio em vários idiomas, legendas, comentários do realizador. Escolher quais ficam, qual é a predefinida e em que ordem aparecem é uma operação simples, mas as ferramentas que existem para isso ou exigem comandos longos de FFmpeg, ou são aplicações pensadas para utilizadores avançados. Queria abrir o ficheiro, ver as faixas, desmarcar o que não quero, arrastar para reordenar e guardar. O Track Manager faz exatamente isso.

Construí-o nas férias da Páscoa de 2026, em 12 dias e lancei a versão 1.0.0 a 8 de abril.

![Track Manager a ler um vídeo de demonstração com duas faixas de áudio.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794514021/cabacatech/2026-11/screenshots/track-manager/track-loaded-a8804ee77d.webp)

## O que faz

- Lê um ficheiro MKV ou MP4 e mostra todas as faixas por tipo, com idioma, codec e indicação de predefinida.
- Remover, reordenar com arrastar e largar, renomear e escolher a faixa predefinida.
- Guardar sem recomprimir o vídeo: as operações reorganizam as faixas que já existem.
- Cópia de segurança automática antes de qualquer operação destrutiva.

## Arquitetura

```text title="visão geral"
React + TypeScript
  DropZone -> TrackList (dnd-kit) -> TrackCard -> ExportDialog
        |
        | REST (multipart)
        v
FastAPI
  routers: files, tracks
  track_service  -> escolhe o motor certo
     |-- motor MKV: mkvpropedit (altera no próprio ficheiro)
     |-- motor MP4: FFmpeg (remux para um ficheiro novo)
```

Não há base de dados nem contas. Cada upload recebe uma pasta temporária com um UUID e a informação das faixas é sempre lida de novo a partir do ficheiro. A fonte de verdade é o próprio vídeo.

## Decisões técnicas

:::decision title="Dois motores, uma interface"
Os dois formatos funcionam de forma muito diferente. Num MKV, o `mkvpropedit` altera os metadados das faixas no próprio ficheiro, quase de imediato, mesmo num ficheiro de vários gigabytes. Num MP4 isso não é possível e é preciso um remux completo com FFmpeg para um ficheiro novo. Escondi esta diferença atrás de uma camada de serviço comum, para que a interface não precise de saber com que formato está a falar.
:::

:::decision title="Uma web app local em vez de uma app de desktop"
Uma interface web dá-me React, animações e arrastar e largar sem empacotar uma aplicação de desktop. Corre no meu computador e também abre noutros dispositivos da rede de casa.
:::

:::decision title="Cópia de segurança em vez de desfazer"
Um sistema de desfazer completo para operações sobre ficheiros de vídeo é complexo e frágil. Uma cópia antes de cada operação destrutiva resolve o mesmo problema com uma fração do código.
:::

:::decision title="FastAPI e TypeScript"
Uma faixa tem muitos campos e várias numerações diferentes. O Pydantic do lado do servidor e o TypeScript do lado do cliente garantem que a mesma estrutura chega igual aos dois lados e o FastAPI gera a documentação da API sozinho, o que ajuda quem quiser contribuir.
:::

## Problemas que tive de resolver

:::details title="Três ferramentas, três formas de contar faixas"
O `ffprobe`, o `mkvmerge` e o `mkvpropedit` numeram as faixas de maneiras diferentes. Uma operação pedida para a faixa 2 podia acabar a mexer noutra. Passei a usar os índices do `ffprobe` como única referência e a traduzi-los para cada ferramenta no momento de executar.
:::

:::details title="Acentos estragados nos nomes das faixas"
No Windows, a saída das ferramentas chegava em cp1252 e os nomes em português apareciam corrompidos. Forcei UTF-8 na leitura, com substituição dos caracteres inválidos em vez de falhar.
:::

:::details title="Ferramentas instaladas que o programa não encontrava"
O FFmpeg e o MKVToolNix instalados pelo winget nem sempre ficam no PATH. Escrevi um resolvedor que procura nas pastas do winget e nos Program Files antes de desistir.
:::

## Limitações conhecidas

Converter de MKV para MP4 não é sempre sem perdas: o MP4 não suporta legendas em imagem, que se perdem e as legendas ASS/SSA são convertidas para `mov_text`, perdendo a formatação. A interface avisa antes de converter.

## O que aprendi

Uma ferramenta pequena e bem delimitada é dos melhores projetos para aprender: o problema cabe na cabeça e os detalhes difíceis (codificação de texto, numeração de faixas, diferenças entre formatos) aparecem todos, sem ficarem escondidos atrás de uma framework.
