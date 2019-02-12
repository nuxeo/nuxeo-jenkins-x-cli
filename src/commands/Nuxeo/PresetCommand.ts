import debug from 'debug';
import fs from 'fs';
import yaml, { LoadOptions } from 'js-yaml';
import path from 'path';
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
        alias: ['n'],
        describe: 'Preset\'s name.',
        required: true,
      }
    });
    args.middleware(this.prepareYaml);
    args.demandCommand();

    return args;
  }

  public handler = async (args: Arguments): Promise<void> => {
    return Promise.resolve();
  }

  protected prepareYaml: MiddlewareFunction = async (args: Arguments): Promise<void> => {
    if (args._nx !== undefined) {
      return Promise.resolve();
    }

    if (require.main === undefined) {
      return Promise.reject('Error occured...');
    }

    const filename: string = path.resolve(path.dirname(require.main.filename), 'presets', `${args.name}.yml`);
    /* tslint:disable:non-literal-fs-path */
    if (!fs.existsSync(filename)) {
      log(`File ${filename} is unknown.`);

      return Promise.reject(`File ${args.name}.yml doesn't exist.`);
    }

    const yml: LoadOptions = yaml.load(fs.readFileSync(filename, 'utf-8'));
    log(yml);
    args._nx = { yml, ...args._nx };

    return Promise.resolve();
  }
}
