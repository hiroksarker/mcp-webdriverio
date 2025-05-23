import type { Options } from '@wdio/types';

export const config: Options.Testrunner = {
    runner: 'local',
    autoCompileOpts: {
        autoCompile: true,
        tsNodeOpts: {
            project: './tsconfig.json',
            transpileOnly: true
        }
    },
    specs: [
        './tests/specs/**/*.spec.ts'
    ],
    exclude: [],
    maxInstances: 10,
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage']
        }
    }],
    logLevel: 'info',
    bail: 0,
    baseUrl: 'https://practicetestautomation.com',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: [
        ['visual', {
            baselineFolder: './screenshots/baseline',
            screenshotPath: './screenshots/current',
            diffFolder: './screenshots/diff',
            saveBaseline: true,
            autoSaveBaseline: true,
            takeScreenshotOnFailure: true,
            takeScreenshotOnSuccess: false,
            blockOutStatusBar: true,
            blockOutToolBar: true,
            blockOutSideBar: true,
            blockOutCaret: true,
            blockOutDialog: true,
            blockOutNotifications: true,
            blockOutScrollBars: true,
            blockOutElements: [],
            ignoreColors: false,
            ignoreAntialiasing: false,
            ignoreLess: false,
            ignoreNothing: false,
            rawMisMatchPercentage: true,
            returnAllCompareData: true,
            savePerInstance: true,
            scaleImagesToSameSize: true,
            tabbableOptions: {
                circle: {
                    size: 18,
                    fontSize: 18,
                    ...Array.from({ length: 1 }, (_, i) => ({ x: 0, y: 0 }))
                },
                line: {
                    color: 'red',
                    width: 1
                }
            },
            toolBarOptions: {
                type: 'always',
                width: 15,
                height: 15,
                xOffset: 0,
                yOffset: 0
            },
            compareOptions: {
                blockOutStatusBar: true,
                blockOutToolBar: true,
                blockOutSideBar: true,
                blockOutCaret: true,
                blockOutDialog: true,
                blockOutNotifications: true,
                blockOutScrollBars: true,
                blockOutElements: [],
                ignoreColors: false,
                ignoreAntialiasing: false,
                ignoreLess: false,
                ignoreNothing: false,
                rawMisMatchPercentage: true,
                returnAllCompareData: true,
                savePerInstance: true,
                scaleImagesToSameSize: true
            }
        }]
    ],
    framework: 'mocha',
    reporters: [
        ['allure', {
            outputDir: 'allure-results',
            disableWebdriverStepsReporting: false,
            disableWebdriverScreenshotsReporting: false,
            addConsoleLogs: true,
            docstring: true,
            takeScreenshotOnFailure: true,
            cleanOutputDir: true,
            command: 'allure generate --clean allure-results',
            useCucumberStepReporter: false
        }]
    ],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    screenshotPath: './screenshots/',
    screenshotOnFailure: true,
    screenshotOnSuccess: false
}; 