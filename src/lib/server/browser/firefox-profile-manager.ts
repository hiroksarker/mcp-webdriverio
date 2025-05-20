import { Logger } from '../logger.js';
import { BaseProfileManager } from './profile-manager.js';
import type { BrowserType } from './types.js';
import { createWriteStream } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import archiver from 'archiver';
import extract from 'extract-zip';

export class FirefoxProfileManager extends BaseProfileManager {
    constructor(logger: Logger) {
        super(logger, 'firefox');
    }

    protected getProfileStoragePath(profileId: string): string {
        return path.join(this.profilesDir, profileId);
    }

    protected async exportProfileData(profileId: string, targetPath: string): Promise<void> {
        const profilePath = this.getProfileStoragePath(profileId);
        const output = createWriteStream(targetPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        return new Promise((resolve, reject) => {
            output.on('close', () => {
                this.logger.info(`Firefox profile ${profileId} exported to ${targetPath}`);
                resolve();
            });

            archive.on('error', (err: Error) => {
                this.logger.error('Failed to export Firefox profile:', err);
                reject(err);
            });

            archive.pipe(output);
            archive.directory(profilePath, false);
            archive.finalize();
        });
    }

    protected async importProfileData(sourcePath: string, profileId: string): Promise<void> {
        const profilePath = this.getProfileStoragePath(profileId);
        await extract(sourcePath, { dir: profilePath });

        // Ensure proper permissions for Firefox profile
        if (process.platform !== 'win32') {
            await fs.chmod(profilePath, 0o700);
        }

        this.logger.info(`Firefox profile imported to ${profilePath}`);
    }

    async createDefaultProfile(): Promise<string> {
        const profile = await this.createProfile({
            name: 'Default Firefox Profile',
            browserType: 'firefox',
            options: {
                args: [
                    '--no-remote',
                    '--disable-gpu',
                    '--disable-dev-shm-usage'
                ]
            },
            metadata: {
                description: 'Default Firefox profile with common settings',
                tags: ['default', 'firefox']
            }
        });

        return profile.id;
    }
} 