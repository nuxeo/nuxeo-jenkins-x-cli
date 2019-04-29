import debug from 'debug';
import { Arguments, CommandModule, Options } from 'yargs';
import { Helper } from '../../lib/Helper';
import { ProcessSpawner } from '../../lib/ProcessSpawner';

const log: debug.IDebugger = debug('command:helm:cleanup');

/**
 * Helm Cleanup wrapper, with as well as remove of the kubernetes namespace
 */
export class CleanupCommand implements CommandModule {
  public command: string = 'cleanup';

  public describe: string = 'Cleanup chart with name and his namespace';

  public builder: { [key: string]: Options } = {
    name: {
      type: 'string',
      demandOption: true,
      coerce: Helper.formatDNS,
    }
  };

  public handler = async (args: Arguments): Promise<void> => {
    log(`Cleanup release ${args.name}`);

    if (args['no-tiller'] === false) {
      await ProcessSpawner.create('helm')
      .arg('delete')
      .arg(args.name)
      .arg('--purge')
      .execWithSpinner()
      .catch(() => {
        log(`App name doesn't exists: ${args.name}`);
      });
    }

    await ProcessSpawner.create('kubectl')
      .arg('delete')
      .arg('ns').arg(args.namespace)
      .execWithSpinner()
      .catch(() => {
        log(`Namespace doesn't exists: ${args.namespace}`);
      });

    return Promise.resolve();
  }
}
