import type { Browser, Element as WebdriverIOElement } from 'webdriverio';

declare module 'webdriverio' {
    interface Browser {
        saveScreen(name: string, options?: {
            fullPage?: boolean;
            hideElements?: string[];
            ignoreColors?: boolean;
            ignoreAlpha?: boolean;
            ignoreAntialiasing?: boolean;
            ignoreLess?: boolean;
            ignoreNothing?: boolean;
            rawMisMatchPercentage?: boolean;
            returnAllCompareData?: boolean;
            saveAboveTolerance?: number;
            scaleImagesToSameSize?: boolean;
            tabbableOptions?: {
                circle?: {
                    stroke?: string;
                    strokeWidth?: number;
                    fill?: string;
                    fillOpacity?: number;
                    radius?: number;
                };
                line?: {
                    color?: string;
                    width?: number;
                };
                focusable?: {
                    stroke?: string;
                    strokeWidth?: number;
                    fill?: string;
                    fillOpacity?: number;
                };
            };
            toolBarOptions?: {
                diff?: boolean;
                misMatch?: boolean;
                actual?: boolean;
                baseline?: boolean;
            };
        }): Promise<void>;
        checkScreen(name: string, options?: {
            fullPage?: boolean;
            hideElements?: string[];
            ignoreColors?: boolean;
            ignoreAlpha?: boolean;
            ignoreAntialiasing?: boolean;
            ignoreLess?: boolean;
            ignoreNothing?: boolean;
            rawMisMatchPercentage?: boolean;
            returnAllCompareData?: boolean;
            saveAboveTolerance?: number;
            scaleImagesToSameSize?: boolean;
            tabbableOptions?: {
                circle?: {
                    stroke?: string;
                    strokeWidth?: number;
                    fill?: string;
                    fillOpacity?: number;
                    radius?: number;
                };
                line?: {
                    color?: string;
                    width?: number;
                };
                focusable?: {
                    stroke?: string;
                    strokeWidth?: number;
                    fill?: string;
                    fillOpacity?: number;
                };
            };
            toolBarOptions?: {
                diff?: boolean;
                misMatch?: boolean;
                actual?: boolean;
                baseline?: boolean;
            };
        }): Promise<{ misMatchPercentage: number }>;
    }

    interface Element extends WebdriverIOElement {
        saveElement(name: string, options?: {
            hideElements?: string[];
        }): Promise<void>;
        checkElement(name: string, options?: {
            hideElements?: string[];
        }): Promise<{ misMatchPercentage: number }>;
        setValue(value: string | number): Promise<void>;
        click(): Promise<void>;
        getText(): Promise<string>;
        waitForDisplayed(options?: { timeout?: number; reverse?: boolean; timeoutMsg?: string }): Promise<boolean>;
    }
}

export {}; 