# Foco — notas para o seminário

## Explicação em um minuto

“O Foco é um gerenciador de tarefas local. A interface usa componentes Ionic e CSS; o React atualiza as telas a partir do estado; o TypeScript verifica os tipos. O Context compartilha tarefas entre as telas e o reducer descreve como elas mudam. O Capacitor coloca a aplicação em um projeto Android e fornece o plugin Preferences para salvar os dados no dispositivo. As listas inteligentes são regras de filtragem; não há inteligência artificial nem servidor.”

## Como o Ionic funciona

O Ionic oferece componentes de interface baseados em tecnologias web, como páginas, barras, buscas, checkboxes, modais e alertas. Seus Web Components encapsulam comportamento, acessibilidade e aparência. `@ionic/react` integra esses componentes ao React. A mesma interface pode ser executada no navegador ou na WebView Android.

Em `src/App.tsx`, `setupIonicReact({ mode: 'ios' })` escolhe a aparência iOS mesmo no Android. Isso muda o estilo dos componentes; o aplicativo continua sendo Android. As cores, espaços e cartões são personalizados em `src/theme/variables.css` e `src/theme/app.css`. O aplicativo usa ícones abertos Ionicons e uma identidade própria.

## Qual é a função do React

React descreve a interface por componentes e JSX. Quando o estado das tarefas muda, React calcula a atualização visual. Componentes recebem propriedades: `TaskRow`, por exemplo, recebe uma tarefa e funções para editar, concluir e excluir. Campos de formulário usam estado local; tarefas ficam no estado global.

TypeScript define `Task`, `TaskDraft`, categorias, prioridades e ações em `src/types/task.ts`. Os tipos ajudam a detectar erros na compilação, mas não validam os dados armazenados em tempo de execução. Por isso, o serviço também valida o JSON recuperado.

## Qual é a função do Capacitor

O Capacitor cria e conecta o projeto Android ao código web. Os arquivos de produção gerados em `dist/` são copiados para o aplicativo nativo. A interface é executada na WebView do Android; plugins fazem a ponte com recursos do sistema.

`capacitor.config.ts` define nome, identificador, pasta web e barras do sistema. `android/` contém o projeto nativo e Gradle Wrapper. Não é necessário reescrever o aplicativo em Java: `MainActivity.java` apenas integra o Capacitor e configura o desenho até as bordas.

## Como a interface é construída

- `IonApp` contém o aplicativo e sua infraestrutura Ionic.
- `IonPage`, `IonHeader`, `IonContent` e `IonFooter` organizam cada tela.
- O dashboard tem busca, cartões das listas, categorias e progresso.
- `TaskList` reaproveita a mesma tela para listas inteligentes e categorias.
- `TaskRow` reúne checkbox circular, título, descrição, categoria, prioridade e vencimento.
- `TaskForm` usa `IonModal` e campos HTML com rótulos, validação e CSS.
- `TaskCollection` reaproveita a lista e a confirmação de exclusão.

Não foi necessário um backend, uma biblioteca de estado adicional nem um sistema complexo de camadas.

## Como as tarefas são armazenadas

`src/services/taskStorage.ts` expõe `loadTasks` e `saveTasks`. O plugin Capacitor Preferences salva uma string JSON na chave `foco.tasks.v1`:

```json
{ "version": 1, "tasks": [] }
```

Cada tarefa possui ID, título, descrição, categoria, prioridade, conclusão, datas de criação/alteração e vencimento opcional. No Android, o Preferences usa SharedPreferences. No navegador, usa localStorage. Não há uma tabela SQL nem comunicação com servidor.

Ao iniciar, o provider aguarda `loadTasks`. Durante esse período, a interface mostra carregamento e bloqueia alterações. Não existe um efeito que grave `[]` antes da leitura terminar. Se o JSON estiver inválido ou a leitura falhar, os dados originais são preservados e aparece a opção de tentar novamente.

As gravações são aguardadas e executadas em sequência. Apenas depois de salvar com sucesso o provider publica o novo estado. Uma falha de gravação mantém a tarefa anterior e apresenta uma mensagem para tentar novamente. A validação e a versão do documento ajudam a evitar alterações silenciosas em dados inesperados.

## Como Context e useReducer gerenciam o estado

`TasksProvider` chama `useReducer(taskReducer, [])`. O Context fornece `tasks`, estado de carregamento e operações às telas por meio de `useTasks`.

O reducer é uma função pura: recebe a lista anterior e uma ação, devolvendo a nova lista sem modificar a anterior. As ações são `load`, `add`, `update`, `delete` e `toggle`. `map` atualiza uma tarefa; `filter` exclui. A atualização preserva seu ID e a data de criação.

Fluxo de criação:

1. O formulário impede título vazio e prepara um `TaskDraft`.
2. `addTask` chama `createTask`, criando ID e timestamps.
3. `commit` coloca a operação na fila e calcula o próximo estado com o reducer.
4. `saveTasks` persiste o documento completo.
5. `dispatch` publica a alteração e React atualiza as telas.
6. O modal fecha e a confirmação de sucesso aparece.

Os contadores são calculados a partir das tarefas, em vez de armazenados separadamente. Assim, não precisam de atualizações manuais em cada ação.

## Listas, filtros e ordenação

Em `src/utils/tasks.ts`, mostre:

- `matchesList`: regras de Hoje, Planejadas, Todas, Prioritárias e Concluídas.
- `filterTasks`: combinação de busca, categoria, prioridade e situação.
- `normalizeText`: busca sem diferenciar acentos ou maiúsculas.
- `sortTasks`: pendentes primeiro; depois vencimento, prioridade e criação.
- `getListCounts`: contadores derivados da mesma regra das listas.
- `validateDraft`: regras de título, tamanho, categorias, prioridades e data.

Hoje inclui atrasadas para que uma tarefa esquecida continue visível. Planejadas reúne pendentes com data. Todas e categorias incluem concluídas; as demais listas pendentes não. O vencimento usa `YYYY-MM-DD` e é tratado como data local, evitando deslocar o dia por fuso horário. Não há notificações: vencimento é uma informação visual e uma regra de organização.

## Como funciona a navegação

`IonReactRouter` integra React Router ao ciclo de navegação Ionic. `IonRouterOutlet` gerencia páginas e transições:

| Caminho | Tela |
| --- | --- |
| `/home` | Dashboard |
| `/lists/:listId` | Lista inteligente |
| `/categories/:categoryId` | Tarefas da categoria |

O dashboard usa `useIonRouter().push` para abrir listas. `IonBackButton` volta com alternativa para `/home`. A criação/edição usa modal sobre a tela atual. O outlet pode manter páginas anteriores montadas para preservar a navegação; por isso, componentes e testes precisam considerar a página ativa. Caminhos desconhecidos voltam ao dashboard, e IDs inválidos mostram uma mensagem.

## Demonstração sugerida — 6 a 8 minutos

1. Abra o dashboard e explique cartões, cores e contadores.
2. Toque em Nova tarefa e tente salvar sem título para mostrar a validação.
3. Crie “Preparar seminário”, categoria Estudo, prioridade Alta e data de hoje.
4. Crie “Comprar café”, categoria Pessoal, prioridade Baixa e sem data.
5. Mostre a primeira em Hoje, Planejadas e Prioritárias, e ambas em Todas.
6. Busque “cafe” para mostrar a busca sem acentos. Em Todas, combine busca com categoria, prioridade e situação; limpe os filtros.
7. Toque no título de uma tarefa e edite título, descrição, categoria ou vencimento.
8. Conclua a tarefa e acompanhe os contadores. Abra Concluídas e reabra pelo checkbox.
9. Abra a exclusão, cancele e depois confirme para mostrar a proteção.
10. Feche completamente o aplicativo Android e abra novamente. Mostre que a tarefa restante foi recuperada.
11. Apresente os arquivos e a separação entre interface, estado e armazenamento.

O app começa sem tarefas fictícias. Crie os exemplos na apresentação. O roteiro de fechar e reabrir deve usar o APK empacotado, não uma sessão temporária de live reload.

## Como demonstrar live reload

Com JDK 21 e o emulador preparado, execute `npm.cmd run android:sync`. Depois mantenha dois terminais:

```powershell
# Terminal 1
npm.cmd run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

```powershell
# Terminal 2
npm.cmd run android:live
```

O emulador acessa o Windows em `http://10.0.2.2:5173`. Altere uma cor em `src/theme/variables.css` ou um texto no dashboard, salve e mostre a atualização. O servidor Vite entrega o código de desenvolvimento e processa as alterações. Isso acelera desenvolvimento; não é o modo de distribuição final.

Encerre com Ctrl+C, execute `npm.cmd run android:sync` e reinstale a versão local antes de gerar o APK de demonstração. Em dispositivo físico, seria necessário um IP da rede local e acesso pelo firewall; os comandos fornecidos aqui destinam-se ao emulador padrão do Android Studio.

## Como ocorre o build Android

1. `npm.cmd run build` executa TypeScript e gera `dist/` com Vite.
2. `npx.cmd cap sync android` copia os arquivos web e sincroniza os plugins.
3. Gradle compila o projeto Android, recursos e plugins, empacotando os arquivos web.
4. `assembleDebug` assina o APK com uma chave de desenvolvimento.
5. O APK é instalado no emulador e abre a WebView com os arquivos locais.

O comando completo é `npm.cmd run android:apk`. O resultado esperado fica em `android/app/build/outputs/apk/debug/app-debug.apk`. A primeira compilação depende de internet, JDK 21, Android SDK 36 e downloads do Gradle. Builds posteriores reutilizam caches. A instalação final funciona sem o servidor Vite.

## Principais diferenças para React Native

| Aspecto | Ionic React + Capacitor | React Native |
| --- | --- | --- |
| Interface | HTML/CSS e Web Components em WebView | Componentes React renderizados em views nativas |
| Estilo | CSS, variáveis e partes expostas pelos componentes | Objetos de estilo e propriedades suportadas pelo React Native |
| Recursos do dispositivo | Plugins Capacitor | Módulos nativos e bibliotecas do ecossistema, frequentemente com Expo |
| Reutilização web | A interface já é web e pode rodar no navegador | Web exige uma adaptação como React Native Web |
| Performance | Adequada a formulários, listas e aplicativos de produtividade | Pode ser vantajosa em interfaces e interações nativas exigentes |
| Conhecimentos compartilhados | React, TypeScript e ferramentas web | React e TypeScript, com diferenças de componentes, estilo e APIs |

Ambos permitem desenvolvimento multiplataforma e integração nativa. React Native também tem código nativo e usa JavaScript; ele não é uma WebView com HTML. A escolha depende do produto e da experiência da equipe. Para este aplicativo acadêmico, Ionic simplifica a interface e a demonstração no navegador e no Android.

## Arquivos para mostrar ao professor

| Arquivo | O que demonstrar |
| --- | --- |
| `src/App.tsx` | Modo iOS, provider e rotas |
| `src/types/task.ts` | Contrato da tarefa e ações tipadas |
| `src/pages/Dashboard.tsx` | Contadores, categorias e navegação |
| `src/pages/TaskList.tsx` | Reutilização da lista e filtros combinados |
| `src/components/TaskForm.tsx` | Formulário, validação e criação/edição |
| `src/components/TaskCollection.tsx` | Confirmação de exclusão e conclusão |
| `src/contexts/TasksProvider.tsx` | Inicialização assíncrona e função `commit` |
| `src/contexts/taskReducer.ts` | Ações e atualizações imutáveis |
| `src/services/taskStorage.ts` | `loadTasks`, `saveTasks`, versão e validação |
| `src/utils/tasks.ts` | Busca, listas inteligentes e ordenação |
| `src/theme/variables.css` e `app.css` | Identidade visual e adaptação de telas |
| `capacitor.config.ts` e `android/` | Ponte para o aplicativo Android |
| Testes em `src/` e `e2e/app.spec.ts` | Evidências de funcionamento |

## Referências oficiais

- [Ionic React e navegação](https://ionicframework.com/docs/react/navigation)
- [Capacitor e Android](https://capacitorjs.com/docs/android)
- [Preferences](https://capacitorjs.com/docs/apis/preferences)
- [Live reload](https://capacitorjs.com/docs/guides/live-reload)
- [Requisitos do Capacitor 8](https://capacitorjs.com/docs/updating/8-0)
- [React: reducer e Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [React Native: componentes nativos](https://reactnative.dev/docs/intro-react-native-components)
