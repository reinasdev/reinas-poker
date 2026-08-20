import type { Page } from "@playwright/test";

/**
 * O Playwright espera o elemento, mas não a hidratação do React: um clique
 * cedo demais cai num formulário ainda estático e some sem efeito.
 * O React 19 pendura `__reactFiber$…`/`__reactProps$…` nos nós ao hidratar,
 * então dá para observar esse sinal sem instrumentar a aplicação.
 */
export async function waitForHydration(page: Page, selector = "form") {
  await page.waitForSelector(selector, { state: "attached" });
  await page.waitForFunction(
    (target) => {
      const node = document.querySelector(target);
      return (
        !!node &&
        Object.keys(node).some((key) => key.startsWith("__react")) &&
        Object.keys(node).length > 0
      );
    },
    selector,
    { timeout: 20_000 },
  );
}
