import debug from 'debug';
import { Arguments, CommandModule } from 'yargs';

const log: debug.IDebugger = debug('command:dummy');

/**
 * Sample Dummy command
 */
export class DummyCommand implements CommandModule {
  public command: string = 'dummy <toto> [titi]';

  public describe: string = 'A wonderful dummy command';

  public handler = (args: Arguments): void => {
    log(args);
  }
}
