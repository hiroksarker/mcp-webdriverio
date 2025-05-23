import AxeBuilder from '@axe-core/webdriverio';
import type { Browser } from 'webdriverio';

export async function checkAccessibility(driver: Browser) {
    const builder = new AxeBuilder({ client: driver });
    return await builder.analyze();
}
