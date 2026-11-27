import { spawn } from 'node:child_process';
import { cp, mkdir, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = new URL('../../', import.meta.url);
const fixture = new URL('../../app/monthly-report-fixture/', import.meta.url);
const out = new URL('../../verification/monthly-report/output/', import.meta.url);
const url = 'http://127.0.0.1:3108/monthly-report-fixture';
let server;
async function waitReady() {
  for (let i = 0; i < 120; i++) {
    try { const response = await fetch(url); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw Error('Local fixture failed to start');
}
try {
  await mkdir(fixture, { recursive: true });
  await cp(new URL('./fixture-page.js.txt', import.meta.url), new URL('./page.js', fixture));
  await mkdir(out, { recursive: true });
  server = spawn('npm', ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', '3108'], {
    cwd: base, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_anonymous_fixture_only' }, stdio: 'inherit',
  });
  await waitReady();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, deviceScaleFactor: 1 });
  let externalRequests = 0;
  await context.route('**/*', route => {
    if (new URL(route.request().url()).hostname !== '127.0.0.1') {
      externalRequests++;
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('.monthly-report-preview').waitFor();
  await page.screenshot({ path: new URL('desktop-diagnostic.png', out).pathname, fullPage: true });
  const expenseRows = await page.locator('.monthly-report-preview section')
    .filter({ has: page.getByRole('heading', { name: '経費明細', exact: true }) })
    .locator('tbody tr').count();
  console.log('Expense detail rows:', expenseRows, 'summary:',
    (await page.locator('.monthly-report-preview').innerText()).slice(0, 500));
  if (expenseRows !== 75) throw Error(`Expense details showed ${expenseRows} of 75 rows`);
  const nominationRow = await page.locator('.monthly-report-preview table').filter({ hasText: '分類計' })
    .locator('tbody tr').first().innerText();
  if (!/1件\s+1件\s+1件\s+3件\s+1件\s+33%/.test(nominationRow))
    throw Error(`F/P/R or R rate mismatch: ${nominationRow}`);
  const text = await page.locator('.monthly-report-preview').innerText();
  for (const phrase of ['女の子別F・P・R集計', 'R率＝R件数÷区分判明件数', '共通経費は女の子へ配賦していません', '経費内訳', '経費明細', '¥285,000'])
    if (!text.includes(phrase)) throw Error(`Missing report text: ${phrase}`);
  const screen = async (name, width, height) => {
    await page.setViewportSize({ width, height });
    const geometry = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: innerWidth,
      preview: document.querySelector('.monthly-report-preview').getBoundingClientRect().width }));
    if (geometry.body > geometry.viewport + 1) throw Error(`${name} horizontal page overflow: ${JSON.stringify(geometry)}`);
    await page.screenshot({ path: new URL(`${name}.png`, out).pathname, fullPage: true });
    console.log(name, geometry);
  };
  await screen('desktop', 1365, 900);
  await screen('mobile', 390, 844);
  await page.setViewportSize({ width: 1365, height: 900 });
  await page.emulateMedia({ media: 'print' });
  const printLayout = await page.evaluate(() => ({
    controlsHidden: getComputedStyle(document.querySelector('.monthly-report-controls')).display === 'none',
    actionsHidden: getComputedStyle(document.querySelector('.monthly-report-actions')).display === 'none',
    tableOverflow: [...document.querySelectorAll('.monthly-report-preview table')]
      .some(table => table.scrollWidth > table.clientWidth + 1),
  }));
  if (!printLayout.controlsHidden || !printLayout.actionsHidden || printLayout.tableOverflow)
    throw Error(`Print layout failed: ${JSON.stringify(printLayout)}`);
  await page.pdf({ path: new URL('monthly-report-anonymous-a4.pdf', out).pathname,
    format: 'A4', preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
  const pdfPath = new URL('monthly-report-anonymous-a4.pdf', out).pathname;
  const info = (await exec('pdfinfo', [pdfPath])).stdout;
  const size = info.match(/Page size:\s+([\d.]+) x ([\d.]+) pts/);
  if (!size || Math.abs(Number(size[1]) - 595.28) > 1 || Math.abs(Number(size[2]) - 841.89) > 1)
    throw Error('PDF is not A4 portrait');
  const pdfText = (await exec('pdftotext', ['-layout', pdfPath, '-'])).stdout;
  const pages = pdfText.split('\f').filter(p => p.trim());
  if (pages.length < 2) throw Error('Long expense table did not span pages');
  if (pdfText.split('\f').some((p, i, all) => i < all.length - 1 && !p.trim())) throw Error('Blank PDF page');
  for (let i = 1; i <= 75; i++) if (!pdfText.includes(`検証用経費${String(i).padStart(2, '0')}`)) throw Error(`PDF missing expense ${i}`);
  for (const [index, pdfPage] of pages.entries()) {
    if (index && /検証用経費\d+/.test(pdfPage) && !pdfPage.includes('日付・計上月'))
      throw Error(`Expense table heading missing on page ${index + 1}`);
  }
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('checkbox', { name: '経費明細' }).uncheck();
  if (await page.locator('.monthly-report-preview').getByRole('heading', { name: '経費明細' }).count())
    throw Error('PDF item switch did not hide expense details');
  if (!await page.locator('.monthly-report-preview').getByRole('heading', { name: '女の子別F・P・R集計' }).count())
    throw Error('PDF item switch hid nomination section');
  await page.pdf({ path: new URL('monthly-report-selected-sections-a4.pdf', out).pathname,
    format: 'A4', preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
  const selectedText = (await exec('pdftotext', ['-layout', new URL('monthly-report-selected-sections-a4.pdf', out).pathname, '-'])).stdout;
  if (selectedText.includes('検証用経費75') || !selectedText.includes('女の子別F・P・R集計'))
    throw Error('PDF item selection was not reflected in output');
  console.log('PDF pages', pages.length);
  if (externalRequests) throw Error(`Blocked ${externalRequests} external requests`);
  await browser.close();
  console.log('Artifacts:', out.pathname);
} finally {
  if (server) { server.kill('SIGTERM'); await new Promise(resolve => setTimeout(resolve, 1000)); }
  await rm(fixture, { recursive: true, force: true });
}
