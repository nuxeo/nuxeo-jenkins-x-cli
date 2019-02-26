import debug from 'debug';
import fs from 'fs';
import { Arguments, Argv, CommandModule, MiddlewareFunction } from 'yargs';
import { ProcessSpawner } from '../lib/ProcessSpawner';

const log: debug.IDebugger = debug('command:nuxeo:preview');
const LINUX: string = 'linux';
const DARWIN: string = 'darwin';

/**
 * Nuxeo Preview Command
 */
export class PreviewCommand implements CommandModule {

  public command: string = 'preview';

  public describe: string = 'Run a preview based on preset';

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.middleware(this.helmInit);
    args.option({
      comment: {
        describe: 'Skip the comment on PR',
        type: 'boolean',
        default: true,
        required: false
      },
      'log-level': {
        describe: 'Log level (ex: debug)',
        type: 'string',
        default: 'debug',
        required: false
      },
      appname: {
        describe: 'App name (optional - taken from Env by default)',
        required: false,
        type: 'string'
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
        type: 'string',
        required: false
      },
      preset: {
        describe: 'Preset name.',
        required: false,
        type: 'string',
        default: 'h2'
      },
      namespace: {
        describe: 'Namespace (optional - computed by default)',
        required: false,
        type: 'string'
      }
    });
    args.example('$0 preview --preview-dir addon/charts/preview', 'Run a preview with a given preview directory');
    args.example('$0 preview --no-comment', 'Run a preview - skipping PR comment');

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

    if (args.preset !== 'h2') {
      fs.appendFileSync(valuesFile, `\nnuxeo:\n ${args.preset}:\n  deploy: true`);
    }

    this._replaceContents(`version: ${process.env.PREVIEW_VERSION}`, 'version:', chartFile);
    this._replaceContents(`repository: ${process.env.DOCKER_REGISTRY}\/${process.env.ORG}\/${process.env.APP_NAME}`,
      'repository:', valuesFile);
    this._replaceContents(`tag: ${process.env.PREVIEW_VERSION}`, 'tag:', valuesFile);

    await ProcessSpawner.create('jx').chCwd(args.previewDir).arg('step').arg('helm').arg('build').execWithSpinner();

    const appname: string = args.appname !== undefined ? <string>args.appname : `${process.env.APP_NAME}`;
    const namespace: string = args.namespace !== undefined ? <string>args.namespace :
      `${args.preset}-${process.env.BRANCH_NAME}-${appname}`.substring(0, 63);

    log(`Preview namespace: ${namespace}`);

    const previewProcess: ProcessSpawner = ProcessSpawner.create('jx')
      .chCwd(args.previewDir)
      .arg('preview')
      .arg('--name')
      .arg(appname)
      .arg('--namespace')
      .arg(namespace)
      .arg('--log-level')
      .arg(args.logLevel);

    if (args.comment === false) {
      previewProcess.arg('--no-comment');
    }

    return previewProcess.execWithSpinner();
  }

  public helmInit: MiddlewareFunction = async (args: Arguments): Promise<void> => {

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
    const content: string = fs.readFileSync(file, 'utf8');
    const regexp: RegExp = new RegExp(`${occurence}.*`, 'g');
    const result: string = content.replace(regexp, replacement);
    /* tslint:disable:non-literal-fs-path */
    fs.writeFileSync(file, result);
  }
}
