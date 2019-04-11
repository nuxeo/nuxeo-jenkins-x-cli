import { Arguments, Argv, CommandModule } from 'yargs';
import { YamlModifier } from '../../lib/YamlModifier';

/**
 * Command to set a value in a YAML file.
 */
export class YAMLSetCommand implements CommandModule {

  public command: string = 'set-value';

  public describe: string = 'Set a value in a YAML file';

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.option({
      key: {
        describe: 'Key to define in the YAML',
        type: 'string',
        required: true
      },
      value: {
        describe: 'The value for the given key',
        type: 'string',
        required: true
      },
      'file-path': {
        alias: ['f'],
        describe: 'The path for the YAML file to edit',
        required: true,
        type: 'string'
      }
    });
    args.example('$0 helm set-value --file-path charts/preview/values.yaml --key key --value value',
      'Define the key "key" with the value "value" in preview/values.yaml');

    return args;
  }

  public handler = (args: Arguments): void => {
    new YamlModifier(<string>args['file-path'])
      .setValue(<string>args.key, args.value)
      .write();
  }
}
