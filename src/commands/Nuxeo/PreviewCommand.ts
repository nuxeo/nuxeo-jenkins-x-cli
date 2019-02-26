import debug from 'debug';
import fs from 'fs';
import { Arguments, Argv, CommandModule, MiddlewareFunction } from 'yargs';
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
    args.middleware(this.helmInit);
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
      },
      'repo-host': {
        alias: ['h'],
        describe: 'Chart Museum Repository to use',
        default: 'http://jenkins-x-chartmuseum:8080',
      },
      preset: {
        describe: 'Preset name.',
        required: false
      },
      namespace: {
        describe: 'Namespace',
        required: true
      }
    });
    args.example('njx preview --preset mongodb --namespace namespace --app appname', 'Run a preview with mongodb env');

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

    switch (args.preset) {
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
    this._replaceContents(`repository: ${process.env.DOCKER_REGISTRY}/${process.env.ORG}/${process.env.APP_NAME}`,
      'repository:', valuesFile);
    this._replaceContents(`tag: ${process.env.PREVIEW_VERSION}`, 'tag:', valuesFile);

    await ProcessSpawner.create('jx').chCwd(args.previewDir).arg('step').arg('helm').arg('build').execWithSpinner();

    return ProcessSpawner.create('jx')
      .chCwd(args.previewDir)
      .arg('preview')
      .arg('--name')
      .arg(args.app)
      .arg('--namespace')
      .arg(args.namespace)
      .arg('--log-level')
      .arg(args.logLevel)
      .arg('--no-comment')
      .arg(args.noComment)
      .execWithSpinner();
  }

  public helmInit: MiddlewareFunction = async (args: Arguments): Promise<void> => {
    log(args);
    const helmHome: string = await ProcessSpawner.create('helm').arg('home').execWithSpinner();
    /* tslint:disable:non-literal-fs-path */
    if (!fs.existsSync(helmHome)) {
      log(`Helm home is not initialized in: ${helmHome}`);
      await ProcessSpawner.create('helm').arg('init').arg('--client-only').execWithSpinner();
      await ProcessSpawner.create('helm')
        .arg('repo')
        .arg('add')
        .arg('local-jenkins-x')
        .arg(args.repoHost)
        .execWithSpinner();
    } else {
      log(`Helm home initialized in: ${helmHome}`);
    }

    return Promise.resolve();
  }

  private readonly _replaceContents = (replacement: string, occurence: string, file: string): void => {
    log(`Replace content '${occurence}' in ${file} by ${replacement}`);
    /* tslint:disable:non-literal-fs-path */
    fs.readFile(file, 'utf8', (err: Error, data: string) => {
      if (err !== undefined && err !== null) {
        return Promise.reject(`Reading ${file} failed - ${err}`);
      }
      const regexp: RegExp = new RegExp(`${occurence}.*`, 'g');
      const result: string = data.replace(regexp, replacement);
      /* tslint:disable:non-literal-fs-path */
      fs.writeFile(file, result, 'utf8', (error: Error) => {
        if (error !== undefined && error !== null) {
          return Promise.reject(`Replacing content in ${file} failed - ${error}`);
        }
      });
    });
  }
}
