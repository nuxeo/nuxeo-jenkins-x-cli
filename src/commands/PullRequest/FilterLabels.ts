import debug from 'debug';
import { Arguments, Argv, CommandModule } from 'yargs';

/**
 * Nuxeo Preset Purge Command - Purge previously installed Nuxeo Preset
 */
export class FilterLabels implements CommandModule {
  public command: string = 'filter-labels';

  public describe: string = 'Filter the labels for the given mode (test or preview)';

  private readonly log: debug.IDebugger = debug('command:pr:filter-labels');

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.options({
      mode: {
        alias: ['m'],
        description: 'The type of labels to filter, either `test` or `preview`',
        required: 'true',
        default: 'preview',
      },
      labels: {
        alias: ['l'],
        type: 'array',
        description: 'The list of labels to filter',
        required: 'true',
      }
    });

    return args;
  }

  public handler = (args: Arguments): string[] => {
    this.log(args);
    // Get the list of labels and the mode to use for the filtering
    const labels: string[] = <string[]>args.labels;
    const mode: string = <string>args.mode;
    // Filter the labels starting with `${mode}/`
    const filtered: string[] = labels.filter((label: string) => label.startsWith(`${mode}/`))
      .map((label: string) => label.substring(mode.length + 1));
    this.log(`Filtered labels ${filtered}`);

    return filtered;
  }
}
