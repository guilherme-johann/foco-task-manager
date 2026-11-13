# Foco — relatório de implementação e validação

Data: 13/11/2026. Implementação feita diretamente neste projeto, sem commits ou push.

## Entrega funcional

Todos os requisitos obrigatórios e complementares solicitados foram implementados: criação, edição, exclusão com confirmação, conclusão e reabertura; categorias Trabalho, Estudo e Pessoal; prioridades Alta, Média e Baixa; busca por título/descrição; filtros combinados; persistência local e recuperação automática; vencimento opcional; cinco listas inteligentes; contadores; ordenação; estados vazios e título obrigatório.

O dashboard, a lista e o modal de formulário usam Ionic em modo iOS, identidade visual própria e interface em português brasileiro. A estrutura separa componentes, telas, contexto/reducer, armazenamento, tipos, utilitários e tema. O projeto Android nativo está criado e configurado com identificador `br.edu.foco.tasks`.

## Ambiente utilizado

| Item | Ambiente |
| --- | --- |
| Sistema | Windows / PowerShell |
| Node.js | 24.19.0 |
| npm | 11.17.0 |
| Ionic React / Router | 9.0.11 |
| React | 19.0.0 |
| Capacitor core / CLI / Android | 8.6.2 |
| Preferences | 8.0.1 |
| JDK usado no build | Microsoft OpenJDK 21.0.13, extraído em `.tooling/` |
| Gradle / Android Gradle Plugin | 8.14.3 / 8.13.0 |
| SDK de compilação / destino | API 36 |
| Emulador | Small_Phone, Android 15 |
| Testes web | Chromium via Microsoft Edge, perfis Pixel 7 e desktop |

O JDK 25 que acompanha o Android Studio instalado apresentou `Unsupported class file major version 69`. A incompatibilidade foi resolvida usando um JDK 21 local, sem alterar o Java global. O SDK Platform 36 necessário foi instalado durante a preparação do build. `.tooling/` está ignorado pelo Git e não é requisito de localização em outros computadores: basta configurar um JDK 21 em `JAVA_HOME`.

## Verificações executadas

| Verificação | Resultado real |
| --- | --- |
| `npm.cmd run lint` | Aprovado: ESLint sem avisos, TypeScript dos testes de interface e Prettier |
| `npm.cmd run test:unit` | 22 testes aprovados em 3 arquivos |
| `npm.cmd run build` | Aprovado: TypeScript e build web de produção |
| `npm.cmd run test:e2e` | 6 cenários aprovados: 3 em perfil mobile e 3 em desktop |
| `npx.cmd cap add android` | Projeto Android gerado com sucesso |
| Sincronização Capacitor | Aprovada, incluindo o plugin Preferences |
| `npm.cmd run android:apk` com JDK 21 | Aprovado: Gradle `BUILD SUCCESSFUL` e APK gerado |
| Instalação com ADB | Aprovada no emulador Android 15 |
| `npm.cmd run test:android` | Aprovado: operações reais na WebView, SharedPreferences e reabertura do processo |
| `git diff --check` | Sem erros de espaços em branco |

### Cobertura dos testes de lógica e armazenamento

- Criação com ID único, campos normalizados e timestamps.
- Geração de ID em HTTP, onde `crypto.randomUUID` pode não estar disponível durante live reload.
- Adição, edição, conclusão, reabertura e exclusão imutáveis no reducer.
- Título vazio, tamanhos máximos, categorias/prioridades inválidas e datas inexistentes.
- Busca sem acentos ou distinção de maiúsculas, combinada com os três filtros.
- Listas inteligentes, tarefas atrasadas e contadores após mudanças de estado.
- Ordenação por conclusão, vencimento, prioridade e criação.
- Datas locais e anos bissextos.
- Leitura/gravação versionada com Preferences; rejeição de JSON inválido, versões inesperadas e IDs duplicados.
- Inicialização assíncrona em React StrictMode, sem sobrescrever tarefas existentes.
- Alterações concorrentes, falha de gravação, preservação do estado e nova tentativa.
- Falha de leitura com bloqueio de alterações e recuperação por nova tentativa.

### Cobertura de interface no navegador

- Abrir pelo caminho raiz, navegar entre listas e voltar.
- Validar título vazio e criar tarefa com todos os campos.
- Editar título, descrição, categoria, prioridade e remover o vencimento.
- Atualizar contadores de listas e categorias.
- Recarregar a página e abrir outra aba para recuperar os mesmos dados.
- Concluir, encontrar em Concluídas e reabrir.
- Cancelar a exclusão e depois confirmar; verificar a exclusão após recarregar.
- Combinar busca, categoria, prioridade e situação, apresentar estado vazio e limpar filtros.
- Abrir formulário, cancelar e preservar navegação.
- Exibir estado de erro para dados corrompidos sem sobrescrevê-los.
- Usar largura de 320 px sem transbordamento horizontal do documento.
- Verificar ausência de exceções JavaScript no fluxo principal.

As capturas do dashboard, lista, formulário e tela pequena foram geradas pelos testes e inspecionadas visualmente. Os testes executam o build de produção, com armazenamento isolado do navegador utilizado pelo usuário.

### Cobertura no Android

O script `scripts/android-smoke.mjs` instala o APK de debug em um emulador existente e controla a WebView de desenvolvimento por ADB/Playwright. Foram verificadas:

1. Criação de tarefa em Estudo, com descrição e prioridade Alta.
2. Edição e conclusão da tarefa.
3. Presença do título e da chave de armazenamento no arquivo SharedPreferences do aplicativo.
4. Encerramento real do processo com `am force-stop`.
5. Novo lançamento da Activity e recuperação da tarefa e dos contadores.
6. Reabertura da tarefa concluída.
7. Navegação pelo botão voltar do Android.
8. Exclusão e verificação de que ela também foi persistida.

O teste exclui somente a tarefa que criou. Não apaga tarefas preexistentes nem limpa os dados do aplicativo. As barras do sistema foram configuradas para conteúdo escuro sobre o fundo claro; os botões da barra superior utilizam os slots oficiais do Ionic. A configuração de bordas ocorre depois da inicialização da Activity pelo Capacitor, evitando a criação antecipada de uma barra nativa sobre o cabeçalho. O teste verifica também a ausência dessa barra, e as capturas nativas do dashboard e da lista corrigidos foram inspecionadas visualmente.

## Artefatos

- APK de demonstração: `android/app/build/outputs/apk/debug/app-debug.apk`.
- Build web: `dist/`.
- Capturas web: `test-results/`.
- Capturas Android: `artifacts/android/` após executar `test:android`.
- Guia de execução, APK e GitHub: `README.md`.
- Conceitos, arquivos relevantes e roteiro da apresentação: `docs/SEMINAR_NOTES.md`.

Builds, APK, capturas, dependências e ferramentas locais estão ignorados pelo Git. O código-fonte nativo e o Gradle Wrapper devem ser versionados.

## Limitações e verificações não executadas

- Testes realizados no emulador Android 15 e em navegador Chromium. Não foi testado em aparelho físico, iOS, Firefox ou Safari, nem em todas as versões Android a partir da API mínima 24.
- Teclados de fabricantes, leitores de tela e configurações extremas de tamanho de fonte exigem avaliação manual adicional.
- O procedimento de live reload está documentado; sua demonstração interativa não foi executada. O APK final usa os arquivos web locais e não contém URL de servidor de desenvolvimento.
- Não foi gerado pacote release, AAB, assinatura de distribuição ou publicação em loja. O APK produzido é de debug para demonstração.
- `npm audit` encontrou **17 avisos moderados**, relacionados às cadeias de minimatch e React Router. `npm audit fix` foi executado sem `--force` e não resolveu esses avisos. As sugestões forçadas mudam versões principais, incluindo o Router fora da faixa suportada pelo Ionic Router instalado; não foram aplicadas. Não houve avisos altos ou críticos nessa auditoria. Esse resultado não equivale a uma auditoria completa de segurança.
- O Vite avisa sobre um bundle principal acima de 500 kB. O build conclui e o APK inclui os arquivos localmente; não foi feita uma etapa adicional de otimização de tamanho.
- Gradle apresenta avisos de `flatDir` da estrutura Capacitor e de operações Java das bibliotecas. Eles não impediram a compilação.
- Os dados ficam no dispositivo e na origem do navegador. Desinstalar/limpar armazenamento remove os dados; não há sincronização, exportação ou backend, conforme o escopo solicitado.

Nenhum commit, push ou publicação foi realizado. O README contém o procedimento para criar um único novo commit com a implementação e enviá-lo a um repositório GitHub escolhido pelo usuário.
