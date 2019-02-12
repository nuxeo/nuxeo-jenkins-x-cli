import debug from 'debug';
import { Arguments, Argv, CommandModule } from 'yargs';
import { PresetCommand } from './Nuxeo/PresetCommand';
import { VCSCommand } from './Nuxeo/VCSCommand';

/**
 * Nuxeo Command to wrapper Nuxeo requirements
 */
export class NuxeoCommand implements CommandModule {
  private readonly log: debug.IDebugger = debug('command:nuxeo');

  public command: string = 'nuxeo';

  public describe: string = 'Entrypoint for Nuxeo commands';

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.command(new VCSCommand());
    args.command(new PresetCommand());
    args.demandCommand();

    return args;
  }

  public handler = async (args: Arguments): Promise<void> => {
    return Promise.resolve();
  }
}
