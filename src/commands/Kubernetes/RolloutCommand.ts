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
        describe: 'Target resource namespace.',
        coerce: Helper.formatNamespace,
      },
      timeout: {
        alias: ['t'],
        type: 'number',
        describe: 'Rollout timeout in seconds.',
        default: 300,
      }
    });

    return args;
  }

  public handler = async (args: Arguments): Promise<string> => {
    return new Promise<string>((resolve: (res: string) => void, reject: (err: Number | Error) => void): void => {
      const k8s: ProcessSpawner = ProcessSpawner.create('kubectl')
        .arg('-n').arg(`${args.namespace}`)
        .arg('rollout').arg('status')
        .arg(`${args.resource}`).arg(`${args.name}`);

      // Protect rollout excecution with a timeout
      const timeout: NodeJS.Timeout = setTimeout(() => {
        k8s.kill();
        reject(new Error('Rollout is taking too long...'));
      }, <number>args.timeout * 1000);

      k8s.execWithSpinner().then((res: string) => {
        clearTimeout(timeout);

        resolve(res);
      }).catch((err: Number | Error) => {
        reject(err);
      });
    });
  }
}
