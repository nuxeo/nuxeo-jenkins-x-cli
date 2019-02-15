import { Arguments, CommandModule } from 'yargs';
import { ProcessSpawner } from '../../../lib/ProcessSpawner';

/**
 * Nuxeo Preset Purge Command - Purge previously installed Nuxeo Preset
 */
export class PurgeCommand implements CommandModule {
  public command: string = 'purge';

  public describe: string = 'purge a preset';

  public handler = async (args: Arguments): Promise<string> => {
    return ProcessSpawner.createSub(args)
      .arg('helm')
      .arg('cleanup')
      .arg('--name').arg(args.name)
      .arg('--namespace').arg(args.namespace)
      .execWithSpinner();
  }
}
