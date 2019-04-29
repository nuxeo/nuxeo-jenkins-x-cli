import { Arguments, CommandModule, Options } from 'yargs';
import { Helper } from '../../lib/Helper';
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
      coerce: Helper.formatDNS,
    },
    values: {
      alias: ['f'],
      type: 'string',
      description: 'Specify values in a YAML file.'
    },
    set: {
      type: 'array',
      description: 'Set values on the command line (can specify multiple or separate values with commas: key1=val1,key2=val2)',
      default: [],
    }
  };

  public handler = async (args: Arguments): Promise<string> => {
    const ps: ProcessSpawner = ProcessSpawner.create('helm')
      .arg('install')
      .arg('--name').arg(args.name)
      .arg('--namespace').arg(args.namespace);

    for (const value of <string[]>args.set) {
      ps.arg('--set').arg(value);
    }

    if (args.values !== undefined) {
      ps.arg('-f').arg(args.values);
    }

    ps.arg(args.chart);

    return ps.execWithSpinner();
  }
}
