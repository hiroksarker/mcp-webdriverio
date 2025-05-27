import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { addFeature, addSeverity, addDescription, addTestId } from '@wdio/allure-reporter';
import { testServer } from '../config/test-server.js';
import { 
    ActionManager, 
    DownloadManager, 
    defaultCapabilities,
    type ExtendedBrowser,
    ActionBuilder 
} from '../../src/lib/server/actions.js';
import path from 'path';

describe('Advanced Actions Example Suite', function() {
    addFeature('Advanced Actions');
    addSeverity('critical');
    addDescription('Example tests using the core action and download implementations', 'text');

    // Increase timeout for complex actions
    this.timeout(60000);  // 60 seconds

    const downloadDir = path.join(process.cwd(), 'downloads');
    let actionManager: ActionManager;
    let downloadManager: DownloadManager;
    let driver: ExtendedBrowser;

    before(async () => {
        // Initialize server with default configuration
        await testServer.initialize();

        // Initialize WebdriverIO server with our capabilities
        await testServer.getServer().webdriverServer.connect({ 
            capabilities: defaultCapabilities 
        });

        driver = testServer.getServer().webdriverServer.getDriver() as ExtendedBrowser;
        actionManager = new ActionManager(driver);
        downloadManager = new DownloadManager(downloadDir);
    });

    after(async () => {
        try {
            await downloadManager.cleanup();
            await testServer.cleanup();
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    });

    describe('Keyboard Actions Example', () => {
        it('should type text using keyboard actions', async () => {
            addTestId('ACTION-EX-001');
            
            // Navigate to login page
            await driver.url('https://practicetestautomation.com/practice-test-login/');
            
            // Focus on username input
            const usernameInput = await driver.$('#username');
            await usernameInput.click();
            
            // Type text using keyboard actions
            await actionManager.performKeyboardAction(['Shift', 't', 'e', 's', 't']);
            
            // Verify input value
            expect(await usernameInput.getValue()).to.equal('TEST');
        });
    });

    describe('Pointer Actions Example', () => {
        it('should perform drag and drop', async () => {
            addTestId('ACTION-EX-002');
            
            // Navigate to drag and drop demo
            await driver.url('https://jqueryui.com/droppable/');
            
            // Switch to iframe
            const frame = await driver.$('.demo-frame');
            await driver.switchToFrame(frame);
            
            // Get element locations
            const draggable = await driver.$('#draggable');
            const droppable = await driver.$('#droppable');
            const dragLocation = await draggable.getLocation();
            const dropLocation = await droppable.getLocation();
            
            // Perform drag and drop
            await actionManager.performPointerAction('mouse', [
                { x: dragLocation.x, y: dragLocation.y },
                { x: dropLocation.x, y: dropLocation.y }
            ]);
            
            // Verify drop
            const dropText = await droppable.getText();
            expect(dropText).to.include('Dropped');
        });
    });

    describe('File Download Example', () => {
        it('should download and verify a file', async () => {
            addTestId('ACTION-EX-003');
            
            // Navigate to download page
            await driver.url('https://practicetestautomation.com/practice-test-downloads/');
            
            // Wait for the page to load completely by checking for any visible content
            await driver.waitUntil(
                async () => {
                    try {
                        // Check for the download section directly
                        const downloadSection = await driver.$('.wp-block-group:has(a[href*="sample.pdf"])');
                        return await downloadSection.isDisplayed();
                    } catch (error) {
                        // Only log actual errors, not expected element not found cases
                        if (!(error instanceof Error) || !error.message.includes('no such element')) {
                            console.error('Error during page load check:', error);
                        }
                        return false;
                    }
                },
                { 
                    timeout: 15000, 
                    timeoutMsg: 'Page did not load properly - could not find the download section'
                }
            );
            
            // Wait for the download link with a more specific selector
            const downloadLink = await driver.$('a[href*="sample.pdf"][download]');
            await downloadLink.waitForDisplayed({ 
                timeout: 10000,
                timeoutMsg: 'Download link not found or not visible'
            });
            
            const fileUrl = await downloadLink.getAttribute('href');
            if (!fileUrl) {
                throw new Error('Download link href attribute is empty');
            }
            
            // Download file
            const downloadedFile = await downloadManager.downloadFile(driver, fileUrl);
            
            // Verify download
            expect(await downloadManager.verifyDownload(downloadedFile)).to.be.true;
            expect(await downloadManager.getFileSize(downloadedFile)).to.be.greaterThan(0);
        });
    });

    describe('Multiple Actions Example', () => {
        it('should perform multiple actions simultaneously', async () => {
            addTestId('ACTION-EX-004');
            
            // Navigate to login page
            await driver.url('https://practicetestautomation.com/practice-test-login/');
            
            // Wait for the page to load
            const usernameInput = await driver.$('#username');
            await usernameInput.waitForDisplayed({ timeout: 5000 });
            await usernameInput.click();
            
            // Use unicode representation for special keys
            await driver.action('key')
                .down('\uE008')  // Shift key unicode
                .down('t')
                .up('t')
                .up('\uE008')    // Shift key unicode
                .perform();
            
            // Verify results
            expect(await usernameInput.getValue()).to.equal('T');
        });
    });
}); 