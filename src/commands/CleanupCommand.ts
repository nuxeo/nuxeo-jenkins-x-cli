import debug from 'debug';
import { Arguments, CommandModule, Options } from 'yargs';

const log: debug.IDebugger = debug('command:cleanup');

/**
 * Cleanup Command Skeleton
 */
export class CleanupCommand implements CommandModule {
  public command: string = 'cleanup';

  public describe: string = 'Cleanup some stuff';

  public builder: { [key: string]: Options } = {
    toto: {
      default: false,
    }
  };

  public handler = (args: Arguments): void => {
    log('%O', args);
  }
}
