import debug from 'debug';
import fs from 'fs';
import path from 'path';
import tmp from 'tmp';
import { Arguments, CommandModule, Options } from 'yargs';
import { Helper } from '../../lib/Helper';
import { ProcessSpawner } from '../../lib/ProcessSpawner';

const log: debug.IDebugger = debug('command:helm:install');

/**
 * Helm Install wrapper
 */
export class InstallCommand implements CommandModule {
  public command: string = 'install <chart>';

  public describe: string = 'Install chart from Jenkins-X Museum';

  public builder: { [key: string]: Options } = {
    name: {
      type: 'string',
      demandOption: true,
      coerce: Helper.formatDNS,
    },
    values: {
      alias: ['f'],
      type: 'string',
      description: 'Specify values in a YAML file.',
      coerce: (file: string): string => {
        return path.resolve(file);
      }
    },
    set: {
      type: 'array',
      description: 'Set values on the command line (can specify multiple or separate values with commas: key1=val1,key2=val2)',
      default: [],
    }
  };

  public handler = async (args: Arguments): Promise<string> => {
    log(`Tiller is ${args['no-tiller'] === true ? 'disabled' : 'enabled'}.`);
    if (args['no-tiller'] === true) {
      // See https://jenkins-x.io/news/helm-without-tiller/
      return this.installWithKubectl(args);
    } else {
      return this.installWithHelm(args);
    }
  }

  protected installWithHelm = async (args: Arguments): Promise<string> => {
    const ps: ProcessSpawner = ProcessSpawner.create('helm')
      .arg('install')
      .arg('--name').arg(args.name)
      .arg('--namespace').arg(args.namespace);

    for (const value of <string[]>args.set) {
      ps.arg('--set').arg(value);
    }

    if (args.values !== undefined) {
      ps.arg('-f').arg(args.values);
    }

    ps.arg(args.chart);

    return ps.execWithSpinner();
  }

  protected installWithKubectl = async (args: Arguments): Promise<string> => {
    const tmpDir: string = tmp.dirSync().name;
    let wDir: string;

    // tslint:disable-next-line:non-literal-fs-path
    if (this.isDirectory(<string>args.chart)) {
      // Check if args.chart is an unpacked chart directory
      wDir = path.resolve(<string>args.chart);
    } else if (this.isTarball(<string>args.chart)) {
      // Check if args.chart is a local archive (toto-x.y.z.tgz)
      // XXX Should be better to rely on Node untar basis
      await ProcessSpawner.create('tar')
        .arg('xf').arg(<string>args.chart)
        .arg('-C').arg(tmpDir)
        .execWithSpinner();

      wDir = path.join(tmpDir, this.chartWithTGZ(<string>args.chart));
    } else if (this.isUrl(<string>args.chart)) {
      // Check if args.chart is an url (https?://URL/chart-x.y.z.tgz)
      await ProcessSpawner.create('helm')
        .arg('fetch')
        .arg('--untar')
        .arg('--untardir').arg(tmpDir)
        .arg(<string>args.chart)
        .execWithSpinner();

      wDir = path.join(tmpDir, this.chartWithTGZ(<string>args.chart));
    } else {
      // Check if args.chart is a repo/chart
      await ProcessSpawner.create('helm')
        .arg('fetch')
        .arg('--untar')
        .arg('--untardir').arg(tmpDir)
        .arg(<string>args.chart)
        .execWithSpinner();

      wDir = path.join(tmpDir, this.chartWithRepo(<string>args.chart));
    }

    await ProcessSpawner.create('kubectl')
      .arg('create').arg('ns').arg(args.namespace)
      .execWithSpinner()
      .catch(() => {
        log(`Namespace already exists: ${args.namespace}`);
      });

    const ps: ProcessSpawner = ProcessSpawner.create('helm')
      .arg('template')
      .arg('--name').arg(args.name)
      .arg('--namespace').arg(args.namespace);

    for (const value of <string[]>args.set) {
      ps.arg('--set').arg(value);
    }

    if (args.values !== undefined) {
      ps.arg('-f').arg(args.values);
    }

    ps.arg('.').chCwd(wDir);

    const ki: ProcessSpawner = ProcessSpawner.create('kubectl')
      .arg('apply')
      .arg('--namespace').arg(`${args.namespace}`)
      .arg('-f').arg('-');

    return ps.pipe(ki).execWithSpinner();
  }

  protected isDirectory(folder: string): boolean {
    try {
      // tslint:disable-next-line:non-literal-fs-path
      return fs.statSync(folder).isDirectory();
    } catch (err) {
      return false;
    }
  }

  protected isTarball(file: string): boolean {
    try {
      // tslint:disable-next-line:non-literal-fs-path
      return file.endsWith('.tgz') && fs.statSync(file).isFile();
    } catch (err) {
      return false;
    }
  }

  protected isUrl(url: string): boolean {
    return /^https?.+/.test(url);
  }

  protected chartWithTGZ(value: string): string {
    const matches: RegExpExecArray | null = /([\w\d-]+)(?:-\d+\.\d+\.\d+)?.tgz$/.exec(value);
    if (matches === null) {
      throw new Error(`Unable to resolve chart name from ${value}`);
    }

    return matches[1];
  }

  protected chartWithRepo(value: string): string {
    const matches: RegExpExecArray | null = /(?:[\w\d-_]+\/)?([\w\d-]+)/.exec(value);
    if (matches === null) {
      throw new Error(`Unable to resolve chart name from ${value}`);
    }

    return matches[1];
  }
}
