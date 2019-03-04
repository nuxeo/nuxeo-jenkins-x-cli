import debug from 'debug';
import fs from 'fs';
import yargs, { Arguments, Argv, CommandModule, MiddlewareFunction } from 'yargs';
import { Helper } from '../lib/Helper';
import { ProcessSpawner } from '../lib/ProcessSpawner';

const log: debug.IDebugger = debug('command:preview');

/**
 * Nuxeo Preview Command
 */
export class PreviewCommand implements CommandModule {

  public command: string = 'preview';

  public describe: string = 'Run a preview based on preset';

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.middleware(this.helmInit);
    args.option({
      tag: {
        describe: 'Docker image\'s tag to deploy.',
        type: 'string',
        required: true,
        default: process.env.PREVIEW_VERSION
      },
      organization: {
        describe: 'Docker image\'s organization to deploy.',
        type: 'string',
        required: true,
        default: process.env.ORG,
      },
      build: {
        describe: 'Preview build version.',
        type: 'string',
        required: true,
        default: process.env.PREVIEW_VERSION,
      },
      comment: {
        describe: 'Skip the comment on PR',
        type: 'boolean',
        default: true
      },
      'log-level': {
        describe: 'Log level (ex: debug)',
        type: 'string',
        default: 'debug'
      },
      'copy-secret': {
        describe: 'K8S Secret to copy',
        type: 'array',
        default: []
      },
      'copy-configmap': {
        describe: 'K8S Config Map to copy',
        type: 'array',
        default: []
      },
      name: {
        describe: 'Name',
        type: 'string',
        default: process.env.APP_NAME,
        required: true,
      },
      'preview-dir': {
        describe: 'The working preview directory',
        default: 'charts/preview'
      },
      'repo-host': {
        alias: ['h'],
        describe: 'Chart Museum Repository to use',
        default: 'http://jenkins-x-chartmuseum:8080',
        type: 'string'
      },
      preset: {
        describe: 'Preset to deploy with Nuxeo',
        type: 'string',
        default: 'default',
      },
      namespace: {
        describe: 'Namespace (optional - computed by default)',
        type: 'string'
      }
    });
    args.example('$0 preview --preview-dir charts/preview', 'Deploy Preview from a given directory');
    args.example('$0 preview --no-comment', 'Deploy Preview - without PR comment');
    args.example('$0 preview --namespace $APP_NAME}-master --tag latest',
      'Deploy Preview and override default namespace and Docker image tag versions');

    return args;
  }

  public handler = async (args: Arguments): Promise<string> => {
    log(args);

    // Update Helm Chart valuesfile
    const valuesFile: string = `${args.previewDir}/values.yaml`;
    /* tslint:disable:non-literal-fs-path */
    if (!fs.existsSync(valuesFile)) {
      return Promise.reject(`File ${valuesFile} is unknown.`);
    }
    this._replaceContents(`repository: ${this.formatDockerImageFullName(args)}`, 'repository:', valuesFile);
    this._replaceContents(`tag: ${args.tag}`, 'tag:', valuesFile);

    // Update Chart definition file
    const chartFile: string = `${args.previewDir}/Chart.yaml`;
    if (!fs.existsSync(chartFile)) {
      return Promise.reject(`File ${chartFile} is unknown.`);
    }
    this._replaceContents(`version: ${args.build}`, 'version:', chartFile);

    await ProcessSpawner.create('jx').chCwd(args.previewDir).arg('step').arg('helm').arg('build').execWithSpinner();

    const namespace: string = args.namespace !== undefined ? <string>args.namespace :
      `${args.preset}-${process.env.BRANCH_NAME}-${args.name}`;
    log(`Preview namespace: ${namespace}`);

    // Copy Secrets and ConfigMap to target NS
    const jxNs: string = await ProcessSpawner.create('jx').arg('ns').arg('-b').execWithSpinner();
    const nsMatch: RegExpMatchArray | null = jxNs.match(/^Using namespace '(.+?)'/);
    log(nsMatch);
    if (nsMatch === null) {
      return Promise.reject('Unable to determine current K8s namespace');
    }
    const currentNs: string = nsMatch[1];
    (<string[]>args['copy-secret']).forEach(async (secret: string) => {
      await ProcessSpawner.createSub(args).arg('k8s').arg('copy')
        .arg('--from').arg(currentNs)
        .arg('--to').arg(namespace)
        .arg('secret').arg(secret)
        .execWithSpinner();
    });
    (<string[]>args['copy-configmap']).forEach(async (cm: string) => {
      await ProcessSpawner.createSub(args).arg('k8s').arg('copy')
        .arg('--from').arg(currentNs)
        .arg('--to').arg(namespace)
        .arg('cm').arg(cm)
        .execWithSpinner();
    });

    const previewProcess: ProcessSpawner = ProcessSpawner.create('jx')
      .chCwd(args.previewDir)
      .arg('preview')
      .arg('--name')
      .arg(args.name)
      .arg('--namespace')
      .arg(Helper.formatNamespace(namespace))
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

  protected formatDockerImageFullName = (args: Arguments): string => {
    return Helper.formatDockerImageFull(args.registry, args.organization, args.name);
  }

  protected formatDockerImageName = (args: Arguments): string => {
    return Helper.formatDockerImage(args.organization, args.name);
  }

  private readonly _replaceContents = (replacement: string, occurence: string, file: string): void => {
    log(`Replace content '${occurence}' in ${file} by ${replacement}`);
    /* tslint:disable:non-literal-fs-path */
    const content: string = fs.readFileSync(file, 'utf8');
    const regexp: RegExp = new RegExp(`${occurence}.*`, 'g');
    const result: string = content.replace(regexp, replacement);

    if (yargs.argv.dryRun === true) {
      log('Result content: %O', result);

      return;
    }

    /* tslint:disable:non-literal-fs-path */
    fs.writeFileSync(file, result);
  }
}
