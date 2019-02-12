import debug from 'debug';
import fs, { PathLike } from 'fs';
import yargs, { Arguments, Argv, CommandModule } from 'yargs';
import { ProcessSpawner } from '../../lib/ProcessSpawner';

const log: debug.IDebugger = debug('command:nuxeo:vcs');

/**
 * Create Nuxeo VCS properties file
 */
export class VCSCommand implements CommandModule {
  public command: string = 'vcs <file>';

  public describe: string = 'Initiate Nuxeo VCS properties file';

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.options({
      properties: {
        alias: ['p'],
        demandOption: true,
        describe: 'Property\'s value.',
        default: {},
      },
      force: {
        describe: 'Override existing file.',
        default: false,
        type: 'boolean',
      },
      base: {
        alias: ['b'],
        default: 'nuxeo.test.vcs',
        type: 'string',
        describe: 'Change properties base. Use dots (.) for implicit object path.'
      },
      'no-header': {
        type: 'boolean',
        default: 'false',
        describe: 'Remove header from generated properties file.'
      }
    });
    args.example('$0 nuxeo vcs -p.server localhost -p.db my-DB nuxeo-test-vcs.properties',
      'Generates a `nuxeo-test-vcs.properties` file with two lines:' +
      '`nuxeo.test.vcs.db=my-DB` and `nuxeo.test.vcs.server=localhost`.');

    return args;
  }

  public handler = async (args: Arguments): Promise<void> => {
    if (!(typeof args.p === 'object')) {
      return Promise.reject(`'properties' options must be an object. Type: ${typeof args.p}`);
    }

    const properties: string[] = this.generateContent(args.base, { ...args.p });

    this.writePropertiesFile(args.file, properties.join('\n'), args.force);

    return Promise.resolve();
  }

  /**
   * Generate properties content
   */
  // tslint:disable-next-line:no-any
  protected generateContent(base: any, obj: any, noHeader: any = false): string[] {
    const properties: string[] = [];
    if (!noHeader) {
      properties.push('#Generated with Nuxeo Jenkins X CLI');
    }
    // XXX Should handle deeper levels than just 1...
    Object.keys(obj).forEach((key: string) => {
      if (typeof obj[key] === 'object') {
        log(`Unable to parse param: ${key} (${typeof obj[key]})`);

        return;
      }
      log(`Adding entry - ${key}: (${obj[key]})`);
      properties.push(`${base}.${key}=${obj[key]}`);
    });

    // Add empty line at the end
    properties.push('');

    return properties;
  }

  // tslint:disable-next-line:no-any
  protected writePropertiesFile(file: any, data: string, force: any = false): void {
    /* tslint:disable:non-literal-fs-path */
    if (!force && fs.existsSync(file)) {
      throw new Error(`File ${file} already exists. User --force to override the existing file.`);
    }

    if (yargs.argv.dryRun === true) {
      return;
    }

    const flag: string = force ? 'w' : 'wx';
    fs.writeFileSync(file, data, {
      flag,
    });
  }
}
