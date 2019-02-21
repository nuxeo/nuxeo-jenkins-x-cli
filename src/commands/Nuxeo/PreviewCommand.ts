import debug from 'debug';
import fs from 'fs';
import { Arguments, Argv, CommandModule } from 'yargs';
import { ProcessSpawner } from '../../lib/ProcessSpawner';

const log: debug.IDebugger = debug('command:nuxeo:preview');
const LINUX: string = 'linux';
const DARWIN: string = 'darwin';
const MONGODB: string = 'mongodb';
const POSTGRESQL: string = 'postgresql';

/**
 * Nuxeo Preview Command
 */
export class PreviewCommand implements CommandModule {

  public command: string = 'preview';

  public describe: string = 'Run a preview based on presets';

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.option({
      'no-comment': {
        describe: 'Skip the comment on PR',
        type: 'boolean'
      },
      'log-level': {
        describe: 'Log level (ex: debug)',
        type: 'string',
        default: 'debug'
      },
      app: {
        describe: 'App name',
        type: 'string',
        required: true
      },
      'preview-dir': {
        describe: 'The working preview directory',
        require: false,
        default: 'charts/preview'
      }
    });
    args.example('njx nuxeo preset --name mongodb --namespace namespace preview --app name', 'Run a preview with mongodb env');

    return args;
  }

  public handler = async (args: Arguments): Promise<string> => {
    log(args);

    if (args.dryRun === true) {
      log('Running Make Preview(s)');
      log('Running jx preview');

      return Promise.resolve('');
    }

    if (process.platform !== DARWIN && process.platform !== LINUX) {
      return Promise.reject('This OS is not supported. Only Darwin and Linux.');
    }

    const valuesFile: string = `${args.previewDir}/values.yaml`;
    const chartFile: string = `${args.previewDir}/Chart.yaml`;
    /* tslint:disable:non-literal-fs-path */
    if (!fs.existsSync(valuesFile)) {
      return Promise.reject(`File ${valuesFile} is unknown.`);
    }
    if (!fs.existsSync(chartFile)) {
      return Promise.reject(`File ${chartFile} is unknown.`);
    }

    switch (args.name) {
      case MONGODB: {
        fs.appendFileSync(valuesFile, `\nnuxeo:\n ${MONGODB}:\n  deploy: false`);
        fs.appendFileSync(valuesFile, `\nnuxeo:\n ${POSTGRESQL}:\n  deploy: true`);
        break;
      }
      case POSTGRESQL: {
        fs.appendFileSync(valuesFile, `\nnuxeo:\n ${MONGODB}:\n  deploy: true`);
        fs.appendFileSync(valuesFile, `\nnuxeo:\n ${POSTGRESQL}:\n  deploy: false`);
        break;
      }
      default:
    }

    this._replaceContents(`version: ${process.env.PREVIEW_VERSION}`, 'version:', chartFile);
    this._replaceContents(`version: ${process.env.PREVIEW_VERSION}`, 'version:', valuesFile);

    await ProcessSpawner.create('jx')
      .arg('preview')
      .arg('--app')
      .arg(args.app)
      .arg('--namespace')
      .arg(args.namespace)
      .arg('--log-level')
      .arg(args.logLevel)
      .arg('--no-comment')
      .arg(args.noComment)
      .execWithSpinner();

    return ProcessSpawner.create('jx').arg('step').arg('helm').arg('build').execWithSpinner();
  }

  private readonly _replaceContents = (replacement: string, occurence: string, file: string): void => {
    /* tslint:disable:non-literal-fs-path */
    fs.readFile(file, 'utf8', (err: Error, data: string) => {
      if (err !== undefined) {
        throw err;
      }
      const regexp: RegExp = new RegExp(`${occurence}.*`, 'g');
      const result: string = data.replace(regexp, replacement);
      /* tslint:disable:non-literal-fs-path */
      fs.writeFile(file, result, 'utf8', (error: Error) => {
        if (error !== undefined) {
          throw error;
        }
      });
    });
  }
}
