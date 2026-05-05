import * as http from "http";
import express from "express";
import { WebSocketServer, WebSocket as WSSocket } from "ws";
import { FileWatcher } from "./watcher";
import { renderPreview } from "./renderer";
import { logger } from "../utils/logger";
import { readManifest, manifestExists } from "../utils/paths";
import { validateManifest } from "../core/manifest";

interface PreviewServerOptions {
  manifestPath: string;
  previewPath: string;
  themeName: string;
  port?: number;
}

export class PreviewServer {
  private app: express.Application;
  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private watcher: FileWatcher;
  private options: PreviewServerOptions;
  private currentPort: number;

  constructor(options: PreviewServerOptions) {
    this.options = options;
    this.currentPort = options.port || 5173;
    this.app = express();
    this.watcher = new FileWatcher();

    this.setupExpress();
    this.setupWatcher();
  }

  private setupExpress(): void {
    this.app.use(express.static("public", { fallthrough: true }));

    this.app.get("/", async (_req, res) => {
      try {
        const manifestExists_ = await manifestExists(this.options.manifestPath);
        if (!manifestExists_) {
          res.status(404).send("manifest.json not found");
          return;
        }

        const manifestData = await readManifest(this.options.manifestPath);
        const validation = validateManifest(manifestData);

        if (!validation.success) {
          const errorHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Theme Preview Error</title>
  <style>
    body { background-color: #1e1e1e; color: #d4d4d4; font-family: monospace; padding: 20px; }
    .error { background-color: #6f1f1f; color: #c46e6e; padding: 15px; border-radius: 4px; }
    h1 { color: #ff6b6b; margin-bottom: 15px; }
  </style>
</head>
<body>
  <h1>⚠️ Manifest Validation Error</h1>
  <div class="error">
    <p><strong>Fix the errors below and save manifest.json to reload:</strong></p>
    <pre>${validation.errors
      .map((e) => `${e.field}: ${e.message}`)
      .join("\n")}</pre>
  </div>
  <script>
    const ws = new WebSocket(\`ws://\${window.location.host}/ws\`);
    ws.addEventListener('message', () => window.location.reload());
  </script>
</body>
</html>`;
          res.setHeader("Content-Type", "text/html");
          res.send(errorHtml);
          return;
        }

        const manifest = validation.data;
        const html = renderPreview(manifest, this.options.themeName);
        res.setHeader("Content-Type", "text/html");
        res.send(html);
      } catch (error) {
        res.status(500).send(
          `Error rendering preview: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private setupWatcher(): void {
    this.watcher.on("change", () => {
      logger.debug("Manifest changed, notifying clients...");
      this.broadcastReload();
    });

    this.watcher.on("error", (error) => {
      logger.error(`Watcher error: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  private broadcastReload(): void {
    if (this.wss) {
      this.wss.clients.forEach((client: WSSocket) => {
        if (client.readyState === WSSocket.OPEN) {
          client.send("reload");
        }
      });
    }
  }

  private setupWebSocket(): void {
    this.wss = new WebSocketServer({ server: this.server as http.Server });

    this.wss.on("connection", (ws: WSSocket) => {
      logger.debug("WebSocket client connected");
      ws.on("error", (error: Error) => {
        logger.debug(`WebSocket error: ${error.message}`);
      });
    });
  }

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      const tryPort = (port: number): void => {
        this.server = this.app.listen(port, () => {
          this.currentPort = port;
          this.setupWebSocket();
          this.watcher.watch(this.options.manifestPath);

          logger.success(`Preview server running at http://localhost:${port}`);
          logger.info(`Watching for changes in: ${this.options.manifestPath}`);
          resolve(port);
        });

        this.server.on("error", (error: NodeJS.ErrnoException) => {
          if (error.code === "EADDRINUSE") {
            logger.debug(`Port ${port} in use, trying ${port + 1}`);
            tryPort(port + 1);
          } else {
            reject(error);
          }
        });
      };

      tryPort(this.currentPort);
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.watcher.close();

      if (this.wss) {
        this.wss.close(() => {
          if (this.server) {
            this.server.close(() => {
              resolve();
            });
          } else {
            resolve();
          }
        });
      } else if (this.server) {
        this.server.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getPort(): number {
    return this.currentPort;
  }
}
