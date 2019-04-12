import debug from 'debug';
import fs from 'fs';
import yaml from 'js-yaml';
import Mustache from 'mustache';
import { Arguments, Argv, CommandModule } from 'yargs';

const log: debug.IDebugger = debug('command:helm:template');

/**
 * Command to set a value in a YAML file.
 */
// tslint:disable:no-any
export class YAMLTemplateCommand implements CommandModule {

  public command: string = 'template';

  public describe: string = 'Replace the variables with values from the env variables in a YAML file';

  protected yaml: any;

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.example('$0 helm template --file-path charts/preview/values.yaml',
      'Replace the variables in preview/values.yaml with values defined in the environment variables');

    return args;
  }

  public handler = (args: Arguments): void => {
    // Write the processed template in the file
    this.yaml = this.processTemplate(<string>args['file-path'], process.env);
    // tslint:disable:non-literal-fs-path
    fs.writeFileSync(<string>args['file-path'], yaml.dump(this.yaml));
  }

  // tslint:disable-next-line:no-any
  protected processTemplate = (path: string, ctx: {}): any => {
    if (!fs.existsSync(path)) {
      log(`File ${path} is unknown.`);
      throw new Error(`File ${path} doesn't exist.`);
    }

    return yaml.load(Mustache.render(fs.readFileSync(path, 'utf-8'), ctx));
  }

}
