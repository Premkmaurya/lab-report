const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const util = require("util");
const config = require("../config/config");
const logger = require("../utils/logger");

const execPromise = util.promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = path.join(process.cwd(), "backups");
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Run mongodump to backup the database
   */
  async runBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(this.backupDir, timestamp);

    try {
      logger.info(`Starting database backup to ${backupPath}...`);
      
      // Use mongodump if available
      const command = `mongodump --uri="${config.MONGO_URI}" --out="${backupPath}"`;
      
      const { stdout, stderr } = await execPromise(command);
      
      logger.info(`Database backup completed successfully: ${backupPath}`, { stdout, stderr });

      await this.cleanOldBackups();
    } catch (error) {
      logger.error("Database backup failed", { error: error.message, stack: error.stack });
    }
  }

  /**
   * Delete backups older than 7 days
   */
  async cleanOldBackups() {
    try {
      const files = await fs.promises.readdir(this.backupDir);
      const now = new Date();
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.promises.stat(filePath);
        
        if (now - stats.mtime.getTime() > SEVEN_DAYS_MS) {
          logger.info(`Deleting old backup: ${file}`);
          await fs.promises.rm(filePath, { recursive: true, force: true });
        }
      }
    } catch (error) {
      logger.error("Failed to clean old backups", { error: error.message, stack: error.stack });
    }
  }
}

module.exports = new BackupService();
