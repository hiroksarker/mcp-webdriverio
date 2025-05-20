import { Logger } from '../logger.js';
import { BaseProfileManager } from './profile-manager.js';
import type { BrowserType } from './types.js';
import { execSync } from 'child_process';
import { createWriteStream } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import archiver from 'archiver';
import extract from 'extract-zip';

export class ChromeProfileManager extends BaseProfileManager {
    constructor(logger: Logger) {
        super(logger, 'chrome');
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
                this.logger.info(`Chrome profile ${profileId} exported to ${targetPath}`);
                resolve();
            });

            archive.on('error', (err: Error) => {
                this.logger.error('Failed to export Chrome profile:', err);
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

        // Ensure proper permissions for Chrome profile
        if (process.platform !== 'win32') {
            execSync(`chmod -R 700 "${profilePath}"`);
        }

        this.logger.info(`Chrome profile imported to ${profilePath}`);
    }

    async getProfilePath(profileId: string): Promise<string> {
        const profile = await this.getProfile(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        const profilePath = this.getProfileStoragePath(profileId);
        if (!await fs.access(profilePath).then(() => true).catch(() => false)) {
            throw new Error(`Profile directory not found: ${profilePath}`);
        }

        return profilePath;
    }

    async createDefaultProfile(): Promise<string> {
        const profile = await this.createProfile({
            name: 'Default Chrome Profile',
            browserType: 'chrome',
            options: {
                args: [
                    '--no-first-run',
                    '--no-default-browser-check',
                    '--disable-extensions',
                    '--disable-popup-blocking',
                    '--disable-notifications'
                ]
            },
            metadata: {
                description: 'Default Chrome profile with common settings',
                tags: ['default', 'chrome']
            }
        });

        return profile.id;
    }
} 