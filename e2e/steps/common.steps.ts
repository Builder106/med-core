import { expect } from '@playwright/test';
import { Given, When, Then } from '../lib/hooks.js';
import { dwellForDemo } from '../lib/dwell.js';

const DEFAULT_PINS: Record<string, string> = {
  'DOC-001': '4242',
  'PAT-001': '1212',
  'ADM-001': '3434',
};

const apiResponses = new WeakMap<object, number>();

Given('I am on the home page', async ({ page }) => {
  await page.goto('/');
  await dwellForDemo(page);
});

Given('I am signed in as {string}', async ({ page }, userId: string) => {
  const pin = DEFAULT_PINS[userId];
  if (!pin) throw new Error(`No default PIN known for ${userId}`);
  const response = await page.request.post('/api/auth/login', {
    data: { userId, pin },
  });
  expect(response.ok()).toBe(true);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await dwellForDemo(page);
});

When('I navigate to {string}', async ({ page }, path: string) => {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await dwellForDemo(page);
});

When('I request the patient record {string}', async ({ page }, patientId: string) => {
  const response = await page.request.get(`/api/patients/${patientId}`);
  apiResponses.set(page, response.status());
});

When('I request the staff directory', async ({ page }) => {
  const response = await page.request.get('/api/staff');
  apiResponses.set(page, response.status());
});

Then('the API response status should be {int}', async ({ page }, status: number) => {
  expect(apiResponses.get(page)).toBe(status);
});

When('I click the {string} button', async ({ page }, label: string) => {
  await page.getByRole('button', { name: new RegExp(label, 'i') }).click();
  await dwellForDemo(page);
});

When('I click the {string} link', async ({ page }, label: string) => {
  await page.getByRole('link', { name: new RegExp(label, 'i') }).click();
  await dwellForDemo(page);
});

When('I fill {string} with {string}', async ({ page }, label: string, value: string) => {
  await page.getByLabel(new RegExp(label, 'i')).fill(value);
});

Then('I should see {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
  await dwellForDemo(page);
});

Then('the page title should contain {string}', async ({ page }, text: string) => {
  await expect(page).toHaveTitle(new RegExp(text, 'i'));
});

Then('the URL should contain {string}', async ({ page }, fragment: string) => {
  await expect(page).toHaveURL(new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
