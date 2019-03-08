import { Arguments, Argv, CommandModule } from 'yargs';
import { CopyCommand } from './Kubernetes/CopyCommand';
import { RolloutCommand } from './Kubernetes/RolloutCommand';

/**
 * Kubernetes Command to wrapper Nuxeo requirements
 */
export class KubernetesCommand implements CommandModule {

  public command: string = 'kubernetes';

  public describe: string = 'Entrypoint for Kubernetes commands';

  public aliases: string[] = ['k8s'];

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.command(new CopyCommand());
    args.command(new RolloutCommand());
    args.demandCommand();

    return args;
  }

  public handler = async (args: Arguments): Promise<void> => {
    return Promise.resolve();
  }
}
