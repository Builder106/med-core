import type { Locator, Page } from '@playwright/test';

/**
 * Inject cursor dot, dark-background pin, and zoom + counter-scale.
 * Re-injected on every page because init scripts auto-rerun on navigation.
 */
export async function installDemoChrome(page: Page) {
  if (process.env.DEMO !== '1') return;

  const zoom = Number(process.env.DEMO_ZOOM ?? 1.3);
  const counterScale = (100 / zoom).toFixed(2);

  await page.addInitScript(
    ({ zoom, counterScale }) => {
      try {
        localStorage.setItem('theme', 'dark');
      } catch {
        // localStorage unavailable
      }

      const style = document.createElement('style');
      style.id = 'demo-chrome';
      style.textContent = `
        html { zoom: ${zoom}; background: #0F2A22 !important; }
        body { background: #0F2A22 !important; }
        :root { --demo-counter-vh: ${counterScale}vh; }
        .min-h-screen { min-height: var(--demo-counter-vh) !important; }
        #demo-cursor {
          position: fixed;
          top: 0;
          left: 0;
          width: 18px;
          height: 18px;
          margin-left: -9px;
          margin-top: -9px;
          border-radius: 50%;
          background: rgba(218, 183, 118, 0.92);
          box-shadow: 0 0 0 3px rgba(33, 72, 56, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3);
          pointer-events: none;
          z-index: 2147483647;
          transition: transform 80ms ease-out;
        }
      `;
      document.documentElement.appendChild(style);

      const cursor = document.createElement('div');
      cursor.id = 'demo-cursor';
      document.documentElement.appendChild(cursor);

      window.addEventListener(
        'mousemove',
        (e) => {
          cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        },
        { passive: true },
      );
    },
    { zoom, counterScale },
  );
}

let typingPatched = false;

/**
 * Patch Locator.fill to animate typing character-by-character in demo mode.
 * Patches the global prototype once per worker. Grabs the prototype off a
 * live locator instance because `@playwright/test` only exports Locator as a
 * type, not a runtime value.
 */
export function patchLocatorFillForDemo(page: Page) {
  if (process.env.DEMO !== '1' || typingPatched) return;
  typingPatched = true;

  const delay = Number(process.env.DEMO_TYPE_DELAY ?? 70);
  const sampleLocator = page.locator('html');
  type FillOptions = Parameters<Locator['fill']>[1];
  const proto = Object.getPrototypeOf(sampleLocator) as { fill: Locator['fill'] };
  const originalFill = proto.fill;
  proto.fill = async function (this: Locator, value: string, options?: FillOptions) {
    if (typeof value === 'string' && value.length > 0 && value.length <= 200) {
      await this.click(options);
      await originalFill.call(this, '', options);
      await this.pressSequentially(value, {
        delay,
        noWaitAfter: options?.noWaitAfter,
        timeout: options?.timeout,
      });
      return;
    }
    return originalFill.call(this, value, options);
  };
}
