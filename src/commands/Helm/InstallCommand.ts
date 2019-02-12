import debug from 'debug';
import { Arguments, CommandModule, Options } from 'yargs';
import { ProcessSpawner } from '../../lib/ProcessSpawner';

const log: debug.IDebugger = debug('command:helm:install');

/**
 * Helm Install wrapper
 */
export class InstallCommand implements CommandModule {
  public command: string = 'install <chart>';

  public describe: string = 'Install chart from Jenkins-X Museum';

  public builder: { [key: string]: Options } = {
    name: {
      type: 'string',
      demandOption: true,
    }
  };

  public handler = async (args: Arguments): Promise<void> => {
    await ProcessSpawner.create('helm')
      .arg('install')
      .arg('--name').arg(args.name)
      .arg('--namespace').arg(args.namespace)
      .arg(args.chart).execWithSpinner();

    return Promise.resolve();
  }
}
