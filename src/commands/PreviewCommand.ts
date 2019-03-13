import debug from 'debug';
import fs from 'fs';
import path from 'path';
import { Arguments, Argv, CommandModule, MiddlewareFunction } from 'yargs';
import { Helper } from '../lib/Helper';
import { ProcessSpawner } from '../lib/ProcessSpawner';
import { YamlModifier } from '../lib/YamlModifier';

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
      },
      runner: {
        describe: 'Define which runner deploys the preview',
        default: 'jx',
        type: 'string',
        choices: ['jx', 'helm']
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
    const valuesFile: string = path.join(`${args.previewDir}`, 'values.yaml');
    new YamlModifier(valuesFile)
      .setValue('nuxeo.nuxeo.image.repository', this.formatDockerImageFullName(args))
      .setValue('nuxeo.nuxeo.image.tag', args.tag)
      .write();

    // Update Chart definition file
    const chartFile: string = path.join(`${args.previewDir}`, 'Chart.yaml');
    new YamlModifier(chartFile)
      .setValue('version', args.build)
      .write();

    let namespace: string = args.namespace !== undefined ? <string>args.namespace :
      `${args.preset}-${process.env.BRANCH_NAME}-${args.name}`;
    namespace = Helper.formatNamespace(namespace);
    log(`Preview namespace: ${namespace}`);

    // Copy Secrets and ConfigMap to target NS
    const jxNs: string = await ProcessSpawner.create('jx').arg('ns').arg('-b').execWithSpinner();
    const nsMatch: RegExpMatchArray | null = jxNs.match(/^Using namespace '(.+?)'/);
    log(nsMatch);
    if (nsMatch === null) {
      return Promise.reject('Unable to determine current K8s namespace');
    }
    const currentNs: string = nsMatch[1];
    for (const secret of <string[]>args['copy-secret']) {
      await ProcessSpawner.createSub(args).arg('k8s').arg('copy')
        .arg('--from').arg(currentNs)
        .arg('--to').arg(namespace)
        .arg('secret').arg(secret)
        .execWithSpinner();
    }
    for (const cm of <string[]>args['copy-configmap']) {
      await ProcessSpawner.createSub(args).arg('k8s').arg('copy')
        .arg('--from').arg(currentNs)
        .arg('--to').arg(namespace)
        .arg('cm').arg(cm)
        .execWithSpinner();
    }

    if (args.runner === 'jx') {
      await ProcessSpawner.create('jx').chCwd(args.previewDir).arg('step').arg('helm').arg('build').execWithSpinner();

      const previewProcess: ProcessSpawner = ProcessSpawner.create('jx')
        .chCwd(args.previewDir)
        .arg('preview')
        .arg('--name')
        .arg(args.name)
        .arg('--namespace')
        .arg(namespace)
        .arg('--log-level')
        .arg(args.logLevel);

      if (args.comment === false) {
        previewProcess.arg('--no-comment');
      }

      return previewProcess.execWithSpinner();
    }

    if (args.runner === 'helm') {
      // While using Helm, e need to rebase values from nuxeo node.
      // This is a requirement as using helm will rely directly on nuxeo/nuxeo chart,
      // and not like preview that has nuxeo/nuxeo as a dependency.
      const presetValues: string = path.join(`${args.previewDir}`, `helm-${args.preset}-values.yaml`);
      new YamlModifier(valuesFile).rebase('nuxeo').write(presetValues);

      const pp: ProcessSpawner = ProcessSpawner.createSub(args)
        .arg('helm').arg('install')
        .arg('--namespace').arg(namespace)
        .arg('--values').arg(presetValues)
        .arg('--name').arg(args.name)
        .arg('local-jenkins-x/nuxeo');

      return pp.execWithSpinner();
    }

    return Promise.reject('Preview runner not defined');
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
}
