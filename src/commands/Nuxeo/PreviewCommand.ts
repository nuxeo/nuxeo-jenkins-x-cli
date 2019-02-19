import debug from 'debug';
import fs from 'fs';
import { Arguments, Argv, CommandModule } from 'yargs';
import { ProcessSpawner } from '../../lib/ProcessSpawner';

const log: debug.IDebugger = debug('command:nuxeo:preview');
const LINUX: string = 'linux';
const DARWIN: string = 'darwin';

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
        type: 'boolean',
        default: false,
      }
    });
    args.option({
      'log-level': {
        describe: 'Log level (ex: debug)',
        type: 'string'
      }
    });
    args.option({
      'pull-secrets': {
        describe: 'Secrets to pull (ex: instance_clid)',
        type: 'string'
      }
    });
    args.option({
      app: {
        describe: 'App name',
        type: 'string',
        required: true
      }
    });
    args.option({
      namespace: {
        describe: 'Namespace',
        type: 'string',
        required: true
      }
    });
    args.example('njx nuxeo preset -n mongodb preview --app name --namespace namespace', 'Run a preview with mongodb env');

    return args;
  }

  public handler = async (args: Arguments): Promise<void> => {
    log(args);

    if (args.dryRun === true) {
      log('Running Make Preview(s)');
      log('Running jx preview');

      return;
    }

    if (process.platform !== DARWIN && process.platform !== LINUX) {
      throw new Error('This OS is not supported. Only Darwin and Linux.');
    }

    const valuesFile: string = `${args.previewDir}/values.yaml`;
    const chartFile: string = `${args.previewDir}/Chart.yaml`;
    /* tslint:disable:non-literal-fs-path */
    if (!fs.existsSync(valuesFile)) {
      log(`File ${valuesFile} is unknown.`);

      return;
    }
    if (!fs.existsSync(chartFile)) {
      log(`File ${chartFile} is unknown.`);

      return;
    }

    this._replaceContents(`version: ${process.env.PREVIEW_VERSION}`, 'version:', chartFile);
    this._replaceContents(`version: ${process.env.PREVIEW_VERSION}`, 'version:', valuesFile);
    if (process.platform === LINUX) {
      this._replaceContents(`repository: ${process.env.DOCKER_REGISTRY}\/${args.ORG}\/${args.app}`, 'repostory:.*', valuesFile);
    }

    await ProcessSpawner.create('jx').execWithSpinner();

    await ProcessSpawner.create('jx')
      .arg('preview')
      .arg('--app')
      .arg(args.app)
      .arg('--namespace')
      .arg(args.namespace)
      .arg('--log-level')
      .arg(args.logLevel)
      .arg('--pull-secrets')
      .arg(args.pullSecrets)
      .arg('--dir')
      .arg('../..')
      .arg('--no-comment')
      .arg(args.noComment)
      .execWithSpinner();

    return Promise.resolve();
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
