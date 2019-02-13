import debug from 'debug';
import { Arguments, Argv, CommandModule } from 'yargs';
import { FilterLabels } from './PullRequest/FilterLabels';

/**
 * Pull Request Command to manipulate the current pull request and fetch information from it.
 */
export class PRCommand implements CommandModule {
  public command: string = 'pr';

  public describe: string = 'Entrypoint for PR commands';

  private readonly log: debug.IDebugger = debug('command:pr');

  public builder: (args: Argv) => Argv = (args: Argv) => {
    this.log(args);
    args.command(new FilterLabels());
    args.demandCommand();

    return args;
  }

  public handler = async (args: Arguments): Promise<void> => {
    return Promise.resolve();
  }
}
