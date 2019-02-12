import debug from 'debug';
import { Arguments, Argv, CommandModule } from 'yargs';
import { InstallCommand } from './Preset/InstallCommand';
import { PurgeCommand } from './Preset/PurgeCommand';

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
    args.options({
      name: {
        alias: ['n'],
        describe: 'Preset\'s name.',
        required: true,
      }
    });
    args.demandCommand();

    return args;
  }

  public handler = async (args: Arguments): Promise<void> => {
    return Promise.resolve();
  }
}
