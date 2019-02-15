import debug from 'debug';
import { Arguments, Argv, CommandModule } from 'yargs';

/**
 * Nuxeo Preset Purge Command - Purge previously installed Nuxeo Preset
 */
export class FilterLabels implements CommandModule {
  public command: string = 'filter-labels';

  public describe: string = 'Filter the labels for the given mode (test or preview)';

  private readonly _log: debug.IDebugger = debug('command:pr:filter-labels');

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
    args.example('$0 pr filter-labels -m test -l test/mongodb test/postgres preview/mongodb',
      'Filter the labels from the given list only for the `test` mode');

    return args;
  }

  public handler = (args: Arguments): void => {
    this._log(args);
    // Get the list of labels and the mode to use for the filtering
    const labels: string[] = <string[]>args.labels;
    const mode: string = <string>args.mode;

    // Write on the stdout stream the filtered list
    process.stdout.write(`${this.filterLabels(labels, mode)}`);
  }

  /**
   * Filter the labels for the given mode.
   * @param labels The list of labels in input
   * @param mode The mode to use for filtering the labels
   */
  protected filterLabels(labels: string[], mode: string): string[] {
    // Filter the labels starting with `${mode}/`
    const filtered: string[] = labels.filter((label: string) => label.startsWith(`${mode}/`))
      .map((label: string) => label.substring(mode.length + 1));
    this._log(`Filtered labels ${filtered}`);

    return filtered;
  }
}
