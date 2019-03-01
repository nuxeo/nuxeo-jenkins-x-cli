import { ChildProcess, spawn } from 'child_process';
import debug from 'debug';
import ora, { Options, Ora } from 'ora';
import { basename } from 'path';
import yargs, { Arguments } from 'yargs';

/**
 * Helper class to easily spawm process
 */
export class ProcessSpawner {
  protected _process: string;

  protected _args: string[] = [];

  protected _envs: { [varName: string]: string } = {};

  protected _cwd: string = '';

  protected _dryRun: boolean = false;

  private readonly _log: debug.IDebugger;

  constructor(process: string) {
    this._process = process;
    this._log = debug(`process:${basename(process)}`);
    this._dryRun = yargs.argv.dryRun === true;
  }

  // tslint:disable-next-line:no-any
  public static create(process: string): ProcessSpawner {
    return new ProcessSpawner(process);
  }

  // tslint:disable-next-line:no-any
  public static createSub(args?: Arguments): ProcessSpawner {
    if (require.main === undefined) {
      throw new Error('Initialization Error');
    }

    // Handle test...
    const filename: string = require.main.filename;
    let ps: ProcessSpawner;
    if (filename.endsWith('.ts') || filename.endsWith('mocha')) {
      ps = ProcessSpawner.create('yarn').arg('run').arg('start');
    } else {
      ps = ProcessSpawner.create(filename);
    }

    if (args !== undefined && args.dryRun === true) {
      ps.arg('--dry-run');
    }

    return ps;
  }

  public arg(arg: string | unknown): ProcessSpawner {
    if (typeof arg === 'string') {
      this._args.push(arg);
    } else {
      this._log(`Unknown argument type: ${arg}`);
    }

    return this;
  }

  public env(key: string, val: string | unknown): ProcessSpawner {
    if (typeof val === 'string') {
      this._envs[key] = val;
    } else {
      this._log(`Unknown value type: ${val}`);
    }

    return this;
  }

  get args(): string {
    return this._args.join(' ');
  }

  get envs(): string {
    return Object.keys(this._envs).map((key: string) => {
      return `${key}=${this._envs[key]}`;
    }).join(';');
  }

  get process(): string {
    return `${this._process}`;
  }

  get cmd(): string {
    return `${this.process} ${this.args}`;
  }

  get cwd(): string {
    return `${this._cwd}`;
  }

  public chDryRun(dr: boolean | unknown): ProcessSpawner {
    this._dryRun = dr === true;

    return this;
  }

  public chCwd(cwd: string | unknown): ProcessSpawner {
    if (typeof cwd === 'string') {
      this._cwd = cwd;
    }

    return this;
  }

  public async execWithSpinner(opts?: Options, succeed?: string, fail?: string): Promise<string> {
    return new Promise((resolve: (res: string) => void, reject: (err: Number | Error) => void): void => {
      const spinner: Ora = ora({
        text: `Executing: ${this.cmd}`,
        ...opts
      });

      spinner.start();
      this.exec().then((value: string): void => {
        spinner.succeed(succeed);
        resolve(value);
      }).catch((err: Number | Error): void => {
        spinner.fail(fail);
        reject(err);
      });
    });
  }

  public async exec(): Promise<string> {
    const proc: ChildProcess = spawn(this._process, this._args, {
      cwd: this._cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...this._envs },
    });

    // Run cmd in dry run, with a fake timeour of 100ms
    if (this._dryRun) {
      return new Promise<string>((resolve: (res: string) => void): void => {
        setTimeout((): void => {
          resolve('');
        }, 100);
      });
    }

    return new Promise<string>((resolve: (res: string) => void, reject: (err: Number | Error) => void): void => {
      const chunks: Uint8Array[] = [];

      proc.stdout.on('data', (data: Buffer) => {
        chunks.push(data);
      });

      proc.stderr.on('data', (data: Buffer) => {
        process.stderr.write(data);
      });

      proc.on('close', (code: number) => {
        this._log(`on close: ${code}`);
        if (code !== 0) {
          reject(code);
        } else {
          resolve(Buffer.concat(chunks).toString().trim());
        }
      });

      proc.on('error', (err: Error) => {
        this._log(`on error: %O`, err);
        reject(err);
      });
    });
  }
}
