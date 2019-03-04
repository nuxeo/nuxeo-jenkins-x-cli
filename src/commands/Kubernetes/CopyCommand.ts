import { Arguments, Argv, CommandModule } from 'yargs';
import { ProcessSpawner } from '../../lib/ProcessSpawner';

/**
 * Copy K8S resource from one namespace to another one
 */
export class CopyCommand implements CommandModule {
  public command: string = 'copy <resource> <name>';

  public describe: string = 'Copy K8s resource from one namespace to another one';

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.option({
      from: {
        type: 'string',
        demandOption: true,
        describe: 'Source resource namespace',
      },
      to: {
        type: 'string',
        demandOption: true,
        describe: 'Target resource namespace',
      }
    });

    return args;
  }

  public handler = async (args: Arguments): Promise<string> => {
    await ProcessSpawner.create('kubectl')
      .arg('get').arg('namespace').arg(`${args.to}`).execWithSpinner()
      .catch(async (err: Number | Error): Promise<string> => {
        if (err === 1) {
          // Try to create target namespace if missing
          return ProcessSpawner.create('kubectl').arg('create').arg('namespace').arg(`${args.to}`).execWithSpinner();
        }

        return Promise.reject(err);
      });

    const createResource: ProcessSpawner = ProcessSpawner.create('kubectl')
      .arg('apply')
      .arg('--namespace').arg(`${args.to}`)
      .arg('-f').arg('-');

    return ProcessSpawner.create('kubectl')
      .arg('get').arg(`${args.resource}`).arg(`${args.name}`)
      .arg('--namespace').arg(`${args.from}`)
      .arg('--export').arg('-o').arg('yaml')
      .pipe(createResource).execWithSpinner();
  }
}
