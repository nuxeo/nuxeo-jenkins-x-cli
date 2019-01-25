import { ChildProcess, spawn } from 'child_process';
import debug from 'debug';
import { basename } from 'path';

/**
 * Helper class to easily spawm process
 */
export class ProcessSpawner {
  protected _process: string;

  protected _args: string[] = [];

  protected _cwd: string = '';

  private _log: debug.IDebugger;

  constructor(process: string) {
    this._process = process;
    this._log = debug(`process:${basename(process)}`);
  }

  public arg(arg: string): ProcessSpawner {
    this._args.push(arg);

    return this;
  }

  get args(): string {
    return this._args.join(' ');
  }

  get process(): string {
    return `${this._process}`;
  }

  get cwd(): string {
    return `${this._cwd}`;
  }

  public chCwd(cwd: string): ProcessSpawner {
    this._cwd = cwd;

    return this;
  }

  public async exec(): Promise<string> {
    const proc: ChildProcess = spawn(this._process, this._args, {
      cwd: this._cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return new Promise<string>((resolve: (res: string) => void, reject: () => void): void => {
      const lines: string[] = [];

      proc.stdout.on('data', (data: Buffer) => {
        const str: string = String(data).trim();
        lines.push(str);
        this._log(str);
      });

      proc.stderr.on('data', (data: Buffer) => {
        this._log(String(data).trim());
      });

      proc.on('close', (code: number) => {
        if (code !== 0) {
          reject();
        } else {
          resolve(lines.join(''));
        }
      });
    });
  }
}
