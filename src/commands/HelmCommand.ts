import debug from 'debug';
import { existsSync } from 'fs';
import { Arguments, Argv, CommandModule, MiddlewareFunction } from 'yargs';
import { Helper } from '../lib/Helper';
import { ProcessSpawner } from '../lib/ProcessSpawner';
import { CleanupCommand } from './Helm/CleanupCommand';
import { InstallCommand } from './Helm/InstallCommand';

const log: debug.IDebugger = debug('command:helm');

/**
 * Helm command wrapper
 */
export class HelmCommand implements CommandModule {

  /**
   * Ensure Helm is correctly configured
   */
  public static helmInit: MiddlewareFunction = async (args: Arguments): Promise<void> => {
    log(args);
    const helmHome: string = await ProcessSpawner.create('helm').arg('home').execWithSpinner();
    if (!existsSync(helmHome)) {
      log(`Helm home is not initialized in: ${helmHome}`);
      await ProcessSpawner.create('helm')
        .arg('init')
        .arg('--client-only')
        .arg('--service-account').arg('jenkins')
        .execWithSpinner();

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

  public command: string = 'helm';

  public describe: string = 'Entrypoint for helm commands';

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.middleware(HelmCommand.helmInit);
    args.command(new InstallCommand());
    args.command(new CleanupCommand());
    args.options({
      'repo-host': {
        alias: ['h'],
        describe: 'Chart Museum Repository to use',
        default: 'http://jenkins-x-chartmuseum:8080',
      },
      namespace: {
        alias: ['n'],
        describe: 'Target Kubernetes namespace.',
        required: true,
        coerce: Helper.formatNamespace,
      },
    });
    args.demandCommand();

    return args;
  }

  public handler = async (args: Arguments): Promise<void> => {
    return Promise.resolve();
  }
}
