import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('/');

  // Click on image-demo
  await page.getByRole('button', { name: 'Simple Images as Stimuli: Decision-Making with Uncertainty Visualizations' }).click();

  // Check that the page contains the introduction text
  const introText = await page.getByText('Welcome to our study. This is a replication of a study by Padilla et al., publis');
  await expect(introText).toBeVisible();

  // Click on the next button
  await page.getByRole('button', { name: 'Next' }).click();

  // Check the page contains the question
  const question1Text = await page.getByText('Will you issue blankets to the alpacas?');
  await expect(question1Text).toBeVisible();

  // Check the page contains the visualization
  const img1 = await page.getByRole('main').getByRole('img');
  await expect(img1).toBeVisible();

  // Select a response and click next
  await page.getByLabel('Yes').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Check the page contains the question
  const question2Text = await page.getByText('Will you issue blankets to the alpacas?');
  await expect(question2Text).toBeVisible();

  // Check the page contains the visualization
  const img2 = await page.getByRole('main').getByRole('img');
  await expect(img2).toBeVisible();

  // Select a response and click next
  await page.getByLabel('No').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Check the page contains the question
  const question3Text = await page.getByText('Will you issue blankets to the alpacas?');
  await expect(question3Text).toBeVisible();

  // Check the page contains the visualization
  const img3 = await page.getByRole('main').getByRole('img');
  await expect(img3).toBeVisible();

  // Select a response and click next
  await page.getByLabel('Yes').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Check that the end of study text renders
  const endText = await page.getByText('Please wait while your answers are uploaded.');
  await expect(endText).toBeVisible();
});
