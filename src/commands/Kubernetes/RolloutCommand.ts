import { Arguments, Argv, CommandModule } from 'yargs';
import { Helper } from '../../lib/Helper';
import { ProcessSpawner } from '../../lib/ProcessSpawner';

/**
 * Rollout K8S resources that waits until pods are running and ready
 */
export class RolloutCommand implements CommandModule {
  public command: string = 'rollout <resource> <name>';

  public describe: string = 'Watch the status of the latest rollout until it\'s done';

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.option({
      namespace: {
        alias: ['ns'],
        type: 'string',
        demandOption: true,
        describe: 'Target resource namespace',
        coerce: Helper.formatNamespace,
      }
    });

    return args;
  }

  public handler = async (args: Arguments): Promise<string> => {
    return ProcessSpawner.create('kubectl')
      .arg('-n').arg(`${args.namespace}`)
      .arg('rollout').arg('status')
      .arg(`${args.resource}`).arg(`${args.name}`)
      .execWithSpinner();
  }
}
