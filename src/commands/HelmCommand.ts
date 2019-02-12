import debug from 'debug';
import { existsSync } from 'fs';
import { Arguments, Argv, CommandModule, MiddlewareFunction } from 'yargs';
import { ProcessSpawner } from '../lib/ProcessSpawner';
import { InstallCommand } from './Helm/InstallCommand';
import { CleanupCommand } from './Helm/CleanupCommand';

export class HelmCommand implements CommandModule {
  private log: debug.IDebugger = debug('command:helm');

  public command: string = 'helm';

  public describe: string = 'Entrypoint for helm commands';

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.middleware(this.helmInit);
    args.command(new InstallCommand());
    args.command(new CleanupCommand());
    args.options({
      'repo-host': {
        alias: ['h'],
        describe: 'Chart Museum Repository to use',
        default: 'http://jenkins-x-chartmuseum:8080',
      },
      namespace: {
        alias: ['ns'],
        describe: 'Target Kubernetes namespace.',
        required: true,
      },
    });
    args.demandCommand();

    return args;
  }

  public helmInit: MiddlewareFunction = async (args: Arguments): Promise<void> => {
    this.log(args);
    const helmHome: string = await ProcessSpawner.create('helm').arg('home').execWithSpinner();
    if (!existsSync(helmHome)) {
      this.log(`Helm home is not initialized in: ${helmHome}`);
      await ProcessSpawner.create('helm').arg('init').arg('--client-only').execWithSpinner();
      await ProcessSpawner.create('helm')
        .arg('repo')
        .arg('add')
        .arg('jenkins-x')
        .arg(args['repo-host'])
        .execWithSpinner();
    } else {
      this.log(`Helm home initialized in: ${helmHome}`)
    }

    return Promise.resolve();
  }

  public handler = async (args: Arguments): Promise<void> => {
    return Promise.resolve();
  }
}
