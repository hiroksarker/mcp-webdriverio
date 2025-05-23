import { Browser } from '@wdio/globals';

declare global {
    namespace WebdriverIO {
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
    }
}

export {}; 