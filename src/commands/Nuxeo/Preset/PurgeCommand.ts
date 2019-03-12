import debug from 'debug';
import { Arguments, CommandModule } from 'yargs';
import { ProcessSpawner } from '../../../lib/ProcessSpawner';

const log: debug.IDebugger = debug('command:nuxeo:preset:purge');

/**
 * Nuxeo Preset Purge Command - Purge previously installed Nuxeo Preset
 */
export class PurgeCommand implements CommandModule {
  public command: string = 'purge';

  public describe: string = 'purge a preset';

  // tslint:disable:no-any
  public handler = async (args: Arguments): Promise<void> => {
    if (args._nx === 'undefined' || args._nx === null) {
      return Promise.reject('Unable to parse corresponding yaml file');
    }

    const nxArgs: any = args._nx;
    const preset: any = nxArgs.yml;

    log(preset);

    if (preset.helm.chart !== undefined) {
      await ProcessSpawner.createSub(args)
        .arg('helm')
        .arg('cleanup')
        .arg('--name').arg(args.name)
        .arg('--namespace').arg(args.namespace)
        .execWithSpinner();
    }

    return Promise.resolve();
  }
}
