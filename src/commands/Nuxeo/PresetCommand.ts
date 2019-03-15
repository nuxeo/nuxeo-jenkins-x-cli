import debug from 'debug';
import fs from 'fs';
import yaml from 'js-yaml';
import Mustache from 'mustache';
import path from 'path';
import process from 'process';
import { Arguments, Argv, CommandModule, MiddlewareFunction } from 'yargs';
import { Helper } from '../../lib/Helper';
import { InstallCommand } from './Preset/InstallCommand';
import { PurgeCommand } from './Preset/PurgeCommand';

const log: debug.IDebugger = debug('command:nuxeo:preset');

/**
 * Nuxeo Preset Command - Trigger preset based actions
 */
export class PresetCommand implements CommandModule {

  // tslint:disable-next-line:no-any
  public static readPreset(preset: string, ctx: {} = {}): {} {
    if (require.main === undefined) {
      throw new Error('Error occured...');
    }

    const filename: string = path.resolve(path.dirname(require.main.filename), 'presets', `${preset}.yml`);

    return { nuxeo: {}, helm: {}, ...this.readYaml(filename, { ...process.env, ...ctx }) };
  }

  // tslint:disable-next-line:no-any
  protected static readYaml = (filename: string, ctx: {} = {}): any => {
    // tslint:disable:non-literal-fs-path
    if (!fs.existsSync(filename)) {
      log(`File ${filename} is unknown.`);

      throw new Error(`File ${filename} doesn't exist.`);
    }

    return yaml.load(Mustache.render(fs.readFileSync(filename, 'utf-8'), ctx));
  }
  public command: string = 'preset';

  public describe: string = 'Entrypoint for Nuxeo Preset commands';

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.command(new InstallCommand());
    args.command(new PurgeCommand());
    args.options({
      name: {
        describe: 'Preset\'s name.',
        required: true
      },
      namespace: {
        describe: 'Base namespace to deploy',
        required: true,
        type: 'string',
        default: process.env.NAMESPACE,
      }
    });
    args.middleware(this.defineNamespace);
    args.middleware(this.addPresetConfiguration);
    args.demandCommand();

    return args;
  }

  public handler = (args: Arguments): void => {
    // Nothing to do
    log(args);
  }

  protected defineNamespace: MiddlewareFunction = (args: Arguments): void => {
    // XXX Cannot use coerce due to limited access to other opts.
    args.namespace = Helper.formatNamespace(`${args.namespace}-${args.name}`);
  }

  protected addPresetConfiguration: MiddlewareFunction = (args: Arguments): void => {
    if (args._nx !== undefined) {
      return;
    }

    const yml: {} = PresetCommand.readPreset(`${args.name}`, { NAMESPACE: args.namespace });
    args._nx = { yml, ...args._nx };
    log(args._nx);
  }
}
