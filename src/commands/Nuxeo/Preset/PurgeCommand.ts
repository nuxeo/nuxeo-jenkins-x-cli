import debug from 'debug';
import { Arguments, CommandModule } from 'yargs';

const log: debug.IDebugger = debug('command:nuxeo:preset:purge');

/**
 * Nuxeo Preset Purge Command - Purge previously installed Nuxeo Preset
 */
export class PurgeCommand implements CommandModule {
  public command: string = 'purge';

  public describe: string = 'purge a preset';

  public handler = (args: Arguments): void => {
    log(args);
  }
}
