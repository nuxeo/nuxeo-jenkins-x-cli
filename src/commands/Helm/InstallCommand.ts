import { Arguments, CommandModule, Options } from 'yargs';
import { ProcessSpawner } from '../../lib/ProcessSpawner';

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
    },
    values: {
      alias: ['f'],
      type: 'string',
      description: 'Specify values in a YAML file.'
    }
  };

  public handler = async (args: Arguments): Promise<string> => {
    const ps: ProcessSpawner = ProcessSpawner.create('helm')
      .arg('install')
      .arg('--name').arg(args.name)
      .arg('--namespace').arg(args.namespace);

    if (args.values !== undefined) {
      ps.arg('-f').arg(args.values);
    }

    ps.arg(args.chart);

    return ps.execWithSpinner();
  }
}
