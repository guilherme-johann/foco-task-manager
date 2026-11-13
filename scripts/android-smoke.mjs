import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { chromium, expect } from '@playwright/test';

const appId = 'br.edu.foco.tasks';
const adbPath = process.env.ANDROID_HOME
  ? join(process.env.ANDROID_HOME, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb')
  : 'adb';
const devices = execFileSync(adbPath, ['devices'], { encoding: 'utf8' });
const serial = process.env.ANDROID_SERIAL || devices.match(/^(emulator-\d+)\s+device$/m)?.[1];
assert(serial, 'Start an Android emulator first, or set ANDROID_SERIAL.');
const adb = (...args) => execFileSync(adbPath, ['-s', serial, ...args], { encoding: 'utf8', timeout: 120_000 }).trim();
const screenshotDirectory = resolve('artifacts/android');
mkdirSync(screenshotDirectory, { recursive: true });

async function connect() {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const pid = adb('shell', 'pidof', appId).split(' ')[0];
      adb('forward', 'tcp:9223', `localabstract:webview_devtools_remote_${pid}`);
      const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 3000, noDefaults: true });
      const page = browser.contexts()[0]?.pages()[0];
      assert(page, 'Android WebView not ready.');
      page.setDefaultTimeout(15_000);
      await expect(page.getByTestId('count-all')).toBeVisible();
      return { browser, page };
    } catch (error) {
      lastError = error;
      await delay(500);
    }
  }
  throw lastError;
}

let browser;
let failure;
try {
  console.log(adb('install', '-r', resolve('android/app/build/outputs/apk/debug/app-debug.apk')));
  adb('shell', 'am', 'force-stop', appId);
  adb('shell', 'am', 'start', '-n', `${appId}/.MainActivity`);
  let connected = await connect();
  browser = connected.browser;
  let page = connected.page;
  const nativeHierarchy = adb('shell', 'dumpsys', 'activity', 'top');
  assert(!/ActionBarContainer\{[^\n]*\sV\./.test(nativeHierarchy), 'A native action bar is covering the Ionic header.');
  const countBefore = Number(await page.getByTestId('count-all').textContent());
  const completedBefore = Number(await page.getByTestId('count-completed').textContent());
  const title = `Teste Android ${Date.now()}`;
  const editedTitle = `${title} editado`;
  await page.getByRole('button', { name: 'Nova tarefa', exact: true }).click();
  let modal = page.locator('ion-modal');
  await modal.getByLabel('Título', { exact: false }).fill(title);
  await modal.getByLabel('Descrição', { exact: false }).fill('Persistência nativa no SharedPreferences');
  await modal.getByRole('combobox', { name: 'Categoria', exact: true }).selectOption('study');
  await modal.getByRole('combobox', { name: 'Prioridade', exact: true }).selectOption('high');
  await modal.getByRole('button', { name: 'Criar tarefa', exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByTestId('count-all')).toHaveText(String(countBefore + 1));
  await page.getByRole('button', { name: `Todas, ${countBefore + 1} tarefas`, exact: true }).click();
  await page.getByRole('button', { name: `Editar tarefa ${title}`, exact: true }).click();
  modal = page.locator('ion-modal');
  await modal.getByLabel('Título', { exact: false }).fill(editedTitle);
  await modal.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(modal).toHaveCount(0);
  await page.getByRole('checkbox', { name: `Concluir tarefa ${editedTitle}`, exact: true }).click();
  await expect(page.getByRole('checkbox', { name: `Reabrir tarefa ${editedTitle}`, exact: true })).toBeChecked();
  const persisted = adb('shell', 'run-as', appId, 'cat', 'shared_prefs/CapacitorStorage.xml');
  assert(
    persisted.includes(editedTitle) && persisted.includes('foco.tasks.v1'),
    'Task was not found in native Preferences.',
  );
  console.log('PASS: native create, edit, completion and SharedPreferences write.');

  await browser.close();
  browser = undefined;
  adb('shell', 'am', 'force-stop', appId);
  adb('shell', 'am', 'start', '-n', `${appId}/.MainActivity`);
  connected = await connect();
  browser = connected.browser;
  page = connected.page;
  await expect(page.getByTestId('count-all')).toHaveText(String(countBefore + 1));
  await expect(page.getByTestId('count-completed')).toHaveText(String(completedBefore + 1));
  await page.screenshot({ path: join(screenshotDirectory, 'webview-dashboard.png'), animations: 'disabled' });
  writeFileSync(
    join(screenshotDirectory, 'native-dashboard.png'),
    execFileSync(adbPath, ['-s', serial, 'exec-out', 'screencap', '-p']),
  );
  await page.getByRole('button', { name: `Concluídas, ${completedBefore + 1} tarefas`, exact: true }).click();
  await page.getByRole('checkbox', { name: `Reabrir tarefa ${editedTitle}`, exact: true }).click();
  await expect(page.getByRole('button', { name: `Editar tarefa ${editedTitle}`, exact: true })).toHaveCount(0);
  console.log('PASS: persistence after Android force-stop and relaunch; reopen task.');
  adb('shell', 'input', 'keyevent', 'KEYCODE_BACK');
  await expect(page.getByRole('heading', { name: 'Um passo de cada vez.' })).toBeVisible();
  await expect(page.locator('ion-router-outlet > .ion-page:not(.ion-page-hidden)')).toHaveCount(1);
  await page.getByRole('button', { name: `Todas, ${countBefore + 1} tarefas`, exact: true }).click();
  await page.getByRole('button', { name: `Excluir tarefa ${editedTitle}`, exact: true }).click();
  await page.getByRole('button', { name: 'Excluir', exact: true }).click();
  await expect(page.getByRole('button', { name: `Editar tarefa ${editedTitle}`, exact: true })).toHaveCount(0);
  assert(
    !adb('shell', 'run-as', appId, 'cat', 'shared_prefs/CapacitorStorage.xml').includes(editedTitle),
    'Deletion was not persisted.',
  );
  console.log('PASS: Android back button, deletion and persisted cleanup.');
  await page.screenshot({ path: join(screenshotDirectory, 'webview-list.png'), animations: 'disabled' });
  writeFileSync(
    join(screenshotDirectory, 'native-list.png'),
    execFileSync(adbPath, ['-s', serial, 'exec-out', 'screencap', '-p']),
  );
} catch (error) {
  failure = error;
} finally {
  if (browser) await browser.close();
  adb('forward', '--remove', 'tcp:9223');
}
if (failure) throw failure;
