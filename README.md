# Foco — Gerenciador de Tarefas

Aplicativo acadêmico mobile para organizar tarefas e acompanhar pequenas conquistas. Interface em português brasileiro, visual iOS do Ionic também no Android e funcionamento local, sem login, backend ou APIs externas.

## Tecnologias

- Ionic React 9, React 19 e TypeScript 5.9.
- Capacitor 8 com projeto Android nativo.
- React Context + `useReducer` para estado global.
- Capacitor Preferences para persistência; CSS e Ionicons para a interface.
- Vite para desenvolvimento e produção; Vitest e Playwright para testes.

O `package-lock.json` registra as versões exatas. Use `npm ci` para reproduzir a instalação.

## Funcionalidades

- Criar, editar, excluir com confirmação, concluir e reabrir tarefas.
- Categorias Trabalho, Estudo e Pessoal; prioridades Alta, Média e Baixa.
- Título obrigatório, descrição opcional e vencimento opcional.
- Busca por título e descrição, sem distinguir acentos ou maiúsculas.
- Filtros combinados de categoria, prioridade e situação.
- Dashboard com contadores, categorias e progresso geral.
- Listas Hoje, Planejadas, Todas, Prioritárias e Concluídas.
- Estados vazios, validação e mensagens de sucesso ou falha.
- Recuperação automática dos dados e proteção contra falhas de leitura e gravação.

### Regras das listas

| Lista | Conteúdo |
| --- | --- |
| Hoje | Pendentes com vencimento hoje **ou atrasadas** |
| Planejadas | Todas as pendentes com vencimento, incluindo atrasadas |
| Todas | Todas as tarefas, incluindo concluídas |
| Prioritárias | Pendentes de prioridade Alta |
| Concluídas | Apenas concluídas; o checkbox permite reabri-las |

Categorias mostram todas as suas tarefas; seus contadores no dashboard mostram somente pendentes. Os filtros refinam a lista selecionada: filtrar concluídas em Hoje, por exemplo, produz uma lista vazia. A ordenação apresenta pendentes primeiro, depois vencimento mais próximo, prioridade e criação mais recente. Datas usam o calendário local, sem conversão de vencimentos para UTC. As listas atualizam a data ao voltar ao aplicativo e periodicamente enquanto ele está aberto.

## Estrutura

```text
src/
  components/   # Formulário, tarefa, filtros, estados e ações reutilizáveis
  pages/        # Dashboard.tsx e TaskList.tsx
  contexts/     # TasksProvider, contexto, useTasks e taskReducer
  services/     # taskStorage: leitura e escrita no Preferences
  types/        # Task, TaskDraft, filtros e ações
  utils/        # Busca, ordenação, validação, datas e opções
  theme/        # Identidade visual e CSS responsivo
  App.tsx       # Ionic em modo ios, provider e rotas
android/        # Projeto nativo Capacitor e Gradle Wrapper
e2e/            # Testes reais de interface
docs/           # Roteiro do seminário e relatório de validação
```

## Executar no navegador

Requer Node.js 22.12 ou superior e npm. Os comandos abaixo usam `npm.cmd` e `npx.cmd`, que funcionam no PowerShell mesmo com a execução de scripts `.ps1` desabilitada. Em outros terminais, `npm` e `npx` também funcionam.

```powershell
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Abra <http://localhost:5173>. Para testar a versão de produção:

```powershell
npm.cmd run build
npm.cmd run preview -- --port 4173
```

Abra <http://localhost:4173>. No navegador, o Preferences usa `localStorage`, associado à origem (protocolo, endereço e porta). Portanto, `localhost:5173`, `127.0.0.1:5173` e `localhost:4173` têm dados separados. Limpar os dados do navegador remove as tarefas. Não há service worker: o aplicativo Android empacotado funciona offline; a página web precisa que seu servidor esteja disponível.

## Android no Windows

Requer Android Studio compatível com Capacitor 8 (2025.2.1 ou superior), **JDK 21**, Android SDK Platform 36, SDK Build Tools e um emulador Android API 24 ou superior. Configure `ANDROID_HOME` e `JAVA_HOME`. O primeiro build precisa de internet para baixar Gradle e dependências. O projeto `android/` já está criado; não execute `cap add android` novamente.

Exemplo de configuração por sessão (ajuste a pasta do seu JDK 21):

```powershell
$env:JAVA_HOME = 'C:\caminho\para\jdk-21'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
java -version
npm.cmd run android:sync
npm.cmd run android:open
```

No Android Studio, selecione **JDK 21** como Gradle JDK, aguarde a sincronização, abra o Device Manager, inicie um dispositivo e execute **Run app**. Java 25 não é compatível com o Gradle 8.14.3 deste projeto.

Para compilar, instalar e executar pela CLI, com o emulador aberto:

Neste ambiente, também está disponível um JDK 21 local, ignorado pelo Git. Para usá-lo nesta sessão:

```powershell
$env:JAVA_HOME = (Resolve-Path '.tooling/jdk-21.0.13.0.2+1').Path
```

Essa pasta não acompanha o repositório: em outro computador, instale/configure seu próprio JDK 21.

```powershell
npm.cmd run android:run
```

Para escolher explicitamente um dispositivo:

```powershell
npx.cmd cap run android --list
npx.cmd cap run android --target ID_DO_DISPOSITIVO
```

Depois de alterar a interface, execute `npm.cmd run android:sync` antes de executar novamente pelo Android Studio. Esse comando recompila a web e atualiza os arquivos nativos. O botão voltar e o fechamento de modais usam a integração Ionic/Capacitor. A configuração de barras do sistema e as áreas seguras consideram o Android com desenho até as bordas.

## Gerar APK de demonstração

Com `JAVA_HOME` apontando para JDK 21:

```powershell
npm.cmd run android:apk
```

Equivalente passo a passo:

```powershell
npm.cmd run android:sync
Set-Location android
.\gradlew.bat assembleDebug
Set-Location ..
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Ele é assinado com a chave de debug, adequado para demonstração e instalação direta, não para publicação na loja.

```powershell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n br.edu.foco.tasks/.MainActivity
```

Feche o app e abra novamente para demonstrar a persistência nativa. No Android, Preferences usa SharedPreferences. Reinstalar com `adb install -r` preserva dados em condições normais; desinstalar o app ou limpar seu armazenamento os remove. Os dados são locais e não sincronizam entre dispositivos.

## Live reload no emulador

Primeiro execute `npm.cmd run android:sync`. Em um terminal:

```powershell
npm.cmd run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Em outro terminal, com o emulador aberto:

```powershell
npm.cmd run android:live
```

O endereço `10.0.2.2` aponta do emulador padrão do Android Studio para o Windows. Altere um texto ou CSS e mostre a atualização. O comando usa a configuração temporária de live reload da CLI. Ao terminar, pressione Ctrl+C, execute `npm.cmd run android:sync` e gere/instale novamente o APK para voltar aos arquivos locais. Os dados web usados em live reload podem ter origem diferente; use o APK local para demonstrar a persistência final.

## Verificações

```powershell
npm.cmd run lint
npm.cmd run test:unit
npm.cmd run test:e2e
npm.cmd run build
```

`test:e2e` compila e testa a versão de produção. No Windows, Playwright usa o Edge instalado, com perfis mobile e desktop. Para usar o Chromium gerenciado pelo Playwright:

```powershell
npx.cmd playwright install chromium
$env:PLAYWRIGHT_CHANNEL = 'chromium'
npm.cmd run test:e2e
```

Os testes criam dados somente em contextos isolados do navegador de teste. Capturas e detalhes de falhas ficam em `test-results/`, ignorado pelo Git. Resultados realmente executados e limitações estão em [docs/VALIDATION_REPORT.md](docs/VALIDATION_REPORT.md).

Com um APK de debug já compilado e o emulador aberto, `npm.cmd run test:android` executa uma verificação adicional por ADB e Playwright na WebView nativa: cria, edita, conclui, força o encerramento, reabre, verifica SharedPreferences e exclui a tarefa criada pelo teste. O script não limpa tarefas preexistentes. Use `ANDROID_SERIAL` para escolher um dispositivo específico. As capturas nativas ficam em `artifacts/android/`, ignorado pelo Git.

## Apresentação e GitHub

Veja [docs/SEMINAR_NOTES.md](docs/SEMINAR_NOTES.md) para conceitos, arquivos e roteiro da demonstração.

Nenhum commit ou push é feito automaticamente. Para reunir a implementação em um único novo commit:

```powershell
git status --short
git diff --check
git add .
git diff --cached --stat
git commit -m "feat: implement Foco task manager with Ionic and Capacitor"
```

Isso cria um commit com as alterações atuais e mantém o histórico existente. Crie um repositório vazio no GitHub, sem inicializar README ou `.gitignore`. Se ainda não houver `origin`:

```powershell
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin HEAD
```

Se `origin` já existir, confira `git remote -v` e use o remoto desejado. `node_modules/`, `dist/`, `.tooling/`, APKs, caches e configurações locais não entram no commit. Mantenha `package-lock.json`, Gradle Wrapper e os arquivos-fonte de `android/` versionados.
