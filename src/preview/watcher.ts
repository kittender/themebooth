import * as fs from "fs";
import { EventEmitter } from "events";
import { logger } from "../utils/logger";

export class FileWatcher extends EventEmitter {
  private watcher: fs.FSWatcher | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceMs = 150;

  watch(filePath: string): void {
    if (this.watcher) {
      this.watcher.close();
    }

    try {
      this.watcher = fs.watch(filePath, (eventType) => {
        if (eventType === "change") {
          // Debounce rapid changes
          if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
          }

          this.debounceTimer = setTimeout(() => {
            logger.debug(`Manifest changed: ${filePath}`);
            this.emit("change");
          }, this.debounceMs);
        }
      });

      logger.debug(`Watching for changes: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to watch file: ${error instanceof Error ? error.message : String(error)}`);
      this.emit("error", error);
    }
  }

  close(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.watcher) {
      this.watcher.close();
    }
  }
}
