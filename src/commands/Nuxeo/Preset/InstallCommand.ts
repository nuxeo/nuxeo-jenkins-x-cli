import debug from 'debug';
import { Arguments, CommandModule } from 'yargs';

const log: debug.IDebugger = debug('command:nuxeo:preset:install');

/**
 * Nuxeo Preset Install Command - Install&Configure Nuxeo Preset
 */
export class InstallCommand implements CommandModule {
  public command: string = 'install';

  public describe: string = 'Install and Configure a preset';

  public handler = (args: Arguments): void => {
    log(args);
  }
}
