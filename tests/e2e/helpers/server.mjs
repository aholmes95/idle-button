import { spawn } from 'node:child_process';

/**
 * Starts an ephemeral Python static HTTP server bound to 127.0.0.1 on an
 * OS-assigned port (port 0).
 *
 * @param {string} rootDir Absolute path to the directory to serve.
 * @returns {Promise<{ port: number, origin: string, url: (relPath: string) => string, stop: () => Promise<void> }>}
 */
export async function startStaticServer(rootDir) {
  const proc = spawn(
    'python3',
    ['-u', '-m', 'http.server', '0', '--bind', '127.0.0.1'],
    {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  let stderrBuf = '';
  proc.stderr.on('data', (chunk) => {
    stderrBuf += chunk.toString();
  });

  const port = await new Promise((resolve, reject) => {
    let stdoutBuf = '';
    const timer = setTimeout(() => {
      cleanup();
      proc.kill('SIGKILL');
      reject(new Error(`Static server timed out waiting for port. stderr: ${stderrBuf}`));
    }, 5000);

    function onData(chunk) {
      stdoutBuf += chunk.toString();
      const match = stdoutBuf.match(/Serving HTTP on \S+ port (\d+)/);
      if (match) {
        cleanup();
        resolve(Number(match[1]));
      }
    }

    function onExit(code, signal) {
      cleanup();
      reject(new Error(`Static server exited prematurely (code=${code}, signal=${signal}). stderr: ${stderrBuf}`));
    }

    function onError(err) {
      cleanup();
      reject(err);
    }

    function cleanup() {
      clearTimeout(timer);
      proc.stdout.off('data', onData);
      proc.off('exit', onExit);
      proc.off('error', onError);
    }

    proc.stdout.on('data', onData);
    proc.once('exit', onExit);
    proc.once('error', onError);
  });

  const origin = `http://127.0.0.1:${port}`;
  let stopped = false;

  async function stop() {
    if (stopped) return;
    stopped = true;
    if (proc.exitCode !== null || proc.signalCode !== null) return;

    await new Promise((resolve) => {
      const killTimer = setTimeout(() => {
        try {
          proc.kill('SIGKILL');
        } catch {
          // already exited
        }
      }, 500);

      proc.once('exit', () => {
        clearTimeout(killTimer);
        resolve();
      });

      try {
        proc.kill('SIGTERM');
      } catch {
        clearTimeout(killTimer);
        resolve();
      }
    });
  }

  return {
    port,
    origin,
    url(relPath = '/') {
      const normalized = relPath.startsWith('/') ? relPath : `/${relPath}`;
      return `${origin}${normalized}`;
    },
    stop,
  };
}
