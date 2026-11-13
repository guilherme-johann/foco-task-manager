import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const storageKey = 'CapacitorStorage.foco.tasks.v1';
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const activePage = (page: Page) =>
  page
    .locator('ion-page:not(.ion-page-hidden), .ion-page:not(.ion-page-hidden)')
    .filter({ has: page.locator('main') })
    .last();

test('creates, validates, edits, persists, completes, reopens and deletes a task', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Um passo de cada vez.' })).toBeVisible();
  await page.getByRole('button', { name: 'Nova tarefa', exact: true }).click();
  const modal = page.locator('ion-modal');
  await modal.getByRole('button', { name: 'Criar tarefa', exact: true }).click();
  await expect(modal.getByRole('alert')).toHaveText('Dê um título à sua tarefa.');
  await modal.getByLabel('Título', { exact: false }).fill('Revisar apresentação');
  await modal.getByLabel('Descrição', { exact: false }).fill('Slides sobre persistência');
  await modal.getByRole('combobox', { name: 'Categoria', exact: true }).selectOption('study');
  await modal.getByRole('combobox', { name: 'Prioridade', exact: true }).selectOption('high');
  await modal.locator('input[type=date]').fill(today());
  await modal.getByRole('button', { name: 'Criar tarefa', exact: true }).click();
  await expect(modal).toHaveCount(0);
  for (const list of ['today', 'planned', 'all', 'priority', 'study'])
    await expect(page.getByTestId(`count-${list}`)).toHaveText('1');
  await page.getByRole('button', { name: 'Todas, 1 tarefas', exact: true }).click();
  await activePage(page).getByRole('button', { name: 'Editar tarefa Revisar apresentação', exact: true }).click();
  await modal.getByLabel('Título', { exact: false }).fill('Apresentar projeto Foco');
  await modal.getByLabel('Descrição', { exact: false }).fill('Demonstrar o aplicativo na aula');
  await modal.getByRole('combobox', { name: 'Categoria', exact: true }).selectOption('work');
  await modal.getByRole('combobox', { name: 'Prioridade', exact: true }).selectOption('low');
  await modal.getByRole('button', { name: 'Remover data' }).click();
  await modal.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(modal).toHaveCount(0);
  await expect(activePage(page).getByTestId('task-row')).toContainText('Demonstrar o aplicativo na aula');
  await page.reload();
  await expect(
    activePage(page).getByRole('button', { name: 'Editar tarefa Apresentar projeto Foco', exact: true }),
  ).toBeVisible();
  const newPage = await context.newPage();
  await newPage.goto('/home');
  await expect(newPage.getByTestId('count-work')).toHaveText('1');
  await expect(newPage.getByTestId('count-study')).toHaveText('0');
  await expect(newPage.getByTestId('count-priority')).toHaveText('0');
  await expect(newPage.getByTestId('count-planned')).toHaveText('0');
  await newPage.close();
  await activePage(page)
    .getByRole('checkbox', { name: 'Concluir tarefa Apresentar projeto Foco', exact: true })
    .click();
  await expect(
    activePage(page).getByRole('checkbox', { name: 'Reabrir tarefa Apresentar projeto Foco', exact: true }),
  ).toBeChecked();
  await page.goto('/home');
  await expect(page.getByTestId('count-completed')).toHaveText('1');
  await expect(page.getByTestId('count-work')).toHaveText('0');
  await page.getByRole('button', { name: 'Concluídas, 1 tarefas', exact: true }).click();
  await activePage(page).getByRole('checkbox', { name: 'Reabrir tarefa Apresentar projeto Foco', exact: true }).click();
  await expect(activePage(page).getByRole('heading', { name: 'Suas conquistas ficam aqui' })).toBeVisible();
  await page.goto('/categories/work');
  await activePage(page).getByRole('button', { name: 'Excluir tarefa Apresentar projeto Foco', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.locator('ion-alert')).toHaveCount(0);
  await expect(activePage(page).getByTestId('task-row')).toHaveCount(1);
  await activePage(page).getByRole('button', { name: 'Excluir tarefa Apresentar projeto Foco', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir', exact: true }).click();
  await expect(activePage(page).getByTestId('task-row')).toHaveCount(0);
  await page.reload();
  await expect(activePage(page).getByRole('heading', { name: 'Espaço para um novo começo' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('combines search and every filter, navigates smart lists and handles small screens', async ({
  page,
}, testInfo) => {
  const date = today();
  await page.goto('/home');
  await expect(page.getByTestId('count-all')).toBeVisible();
  await page.evaluate(
    ({ key, date }) => {
      const task = {
        description: 'Revisar persistência com React',
        category: 'study',
        priority: 'high',
        dueDate: date,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          tasks: [
            { ...task, id: 'one', title: 'Preparar seminário' },
            { ...task, id: 'two', title: 'Comprar café', category: 'personal', priority: 'low', dueDate: undefined },
            { ...task, id: 'three', title: 'Entregar relatório', category: 'work', completed: true },
            { ...task, id: 'four', title: 'Ler capítulo', priority: 'medium', dueDate: '2099-12-31' },
          ],
        }),
      );
    },
    { key: storageKey, date },
  );
  await page.reload();
  await expect(page.getByTestId('count-all')).toHaveText('4');
  await expect(page.getByTestId('count-today')).toHaveText('1');
  await expect(page.getByTestId('count-planned')).toHaveText('2');
  await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true, animations: 'disabled' });
  const search = page.getByRole('searchbox');
  await search.fill('CAFE');
  await expect(page.getByTestId('task-row')).toHaveCount(1);
  await expect(page.getByTestId('task-row')).toContainText('Comprar café');
  await search.fill('');
  await page.getByRole('button', { name: 'Todas, 4 tarefas', exact: true }).click();
  const current = activePage(page);
  await current.getByRole('button', { name: 'Mostrar filtros' }).click();
  await current.getByRole('searchbox').fill('PERSISTENCIA');
  await current.getByRole('combobox', { name: 'Categoria', exact: true }).selectOption('study');
  await current.getByRole('combobox', { name: 'Prioridade', exact: true }).selectOption('high');
  await current.getByRole('combobox', { name: 'Situação', exact: true }).selectOption('pending');
  await expect(current.getByTestId('task-row')).toHaveCount(1);
  await expect(current.getByTestId('task-row')).toContainText('Preparar seminário');
  await current.getByRole('combobox', { name: 'Situação', exact: true }).selectOption('completed');
  await expect(current.getByRole('heading', { name: 'Nenhuma tarefa encontrada' })).toBeVisible();
  await current.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(current.getByTestId('task-row')).toHaveCount(4);
  await current.getByRole('button', { name: 'Mostrar filtros' }).click();
  await page.screenshot({ path: testInfo.outputPath('task-list.png'), fullPage: true, animations: 'disabled' });
  await current.getByRole('button', { name: 'Nova tarefa', exact: true }).click();
  await expect(page.locator('ion-modal').getByRole('heading', { name: 'Tire uma ideia do papel.' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('task-form.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.locator('ion-modal')).toHaveCount(0);
  await current.getByRole('button', { name: 'Início', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Um passo de cada vez.' })).toBeVisible();
  for (const [label, count] of [
    ['Hoje', 1],
    ['Planejadas', 2],
    ['Prioritárias', 1],
    ['Concluídas', 1],
  ] as const) {
    await page.getByRole('button', { name: `${label}, ${count} tarefas`, exact: true }).click();
    await expect(activePage(page).getByTestId('task-row')).toHaveCount(count);
    await activePage(page).getByRole('button', { name: 'Início', exact: true }).click();
    await expect(page.locator('ion-router-outlet > .ion-page:not(.ion-page-hidden)')).toHaveCount(1);
  }
  await page.setViewportSize({ width: 320, height: 640 });
  await expect(page.getByRole('button', { name: 'Nova tarefa', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('small-screen.png'), fullPage: true, animations: 'disabled' });
});

test('preserves corrupt storage and allows retry without overwriting', async ({ page }) => {
  await page.goto('/home');
  await page.evaluate((key) => localStorage.setItem(key, '{invalid json'), storageKey);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Não foi possível abrir suas tarefas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nova tarefa', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'Não foi possível abrir suas tarefas' })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe('{invalid json');
});
