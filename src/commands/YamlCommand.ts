import { Arguments, Argv, CommandModule } from 'yargs';
import { YAMLSetCommand } from './Yaml/YamlSetCommand';
import { YAMLTemplateCommand } from './Yaml/YamlTemplateCommand';

/**
 * YAML command wrapper
 */
export class YAMLCommand implements CommandModule {

  public command: string = 'yaml';

  public describe: string = 'Entrypoint for yaml commands';

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.command(new YAMLSetCommand());
    args.command(new YAMLTemplateCommand());
    args.option({
      'file-path': {
        alias: ['f'],
        describe: 'The path for the YAML file to edit',
        required: true,
        type: 'string'
      }
    });

    return args;
  }

  public handler = async (args: Arguments): Promise<void> => {
    return Promise.resolve();
  }
}
