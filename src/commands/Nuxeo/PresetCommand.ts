import debug from 'debug';
import fs from 'fs';
import yaml from 'js-yaml';
import Mustache from 'mustache';
import path from 'path';
import process from 'process';
import { Arguments, Argv, CommandModule, MiddlewareFunction } from 'yargs';
import { InstallCommand } from './Preset/InstallCommand';
import { PurgeCommand } from './Preset/PurgeCommand';
import { PreviewCommand } from './PreviewCommand';

const log: debug.IDebugger = debug('command:nuxeo:preset');

/**
 * Nuxeo Preset Command - Trigger preset based actions
 */
export class PresetCommand implements CommandModule {
  public command: string = 'preset';

  public describe: string = 'Entrypoint for Nuxeo Preset commands';

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.command(new InstallCommand());
    args.command(new PurgeCommand());
    args.command(new PreviewCommand());
    args.options({
      name: {
        describe: 'Preset\'s name.',
        required: true
      },
      namespace: {
        alias: ['n'],
        describe: 'Kubernetes target namespace',
        require: true
      }
    });
    args.middleware(this.addPresetConfiguration);
    args.demandCommand();

    return args;
  }

  public handler = async (args: Arguments): Promise<void> => {
    return Promise.resolve();
  }

  // tslint:disable-next-line:no-any
  protected readYaml = (filename: string, ctx: {} = {}): any => {
    // tslint:disable:non-literal-fs-path
    if (!fs.existsSync(filename)) {
      log(`File ${filename} is unknown.`);

      throw new Error(`File ${filename} doesn't exist.`);
    }

    return yaml.load(Mustache.render(fs.readFileSync(filename, 'utf-8'), ctx));
  }

  protected addPresetConfiguration: MiddlewareFunction = (args: Arguments): void => {
    if (args._nx !== undefined) {
      return;
    }

    if (require.main === undefined) {
      throw new Error('Error occured...');
    }

    const filename: string = path.resolve(path.dirname(require.main.filename), 'presets', `${args.name}.yml`);
    // tslint:disable-next-line:no-any
    const yml: any = this.readYaml(filename, process.env);
    log(yml);
    args._nx = { yml, ...args._nx };

    return;
  }
}
