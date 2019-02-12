import debug from 'debug';
import { Arguments, Argv, CommandModule } from 'yargs';
import { ProcessSpawner } from '../../lib/ProcessSpawner';

const log: debug.IDebugger = debug('command:nuxeo:preview');

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
        default: 'false',
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
    args.example('njx preset -n mongodb preview --app name --namespace namespace', 'Run a preview with mongodb env');
    args.demandCommand();

    return args;
  }

  public handler = async (args: Arguments): Promise<void> => {
    log(args);

    // for (let name of args.presets){
    //   await ProcessSpawner.create('make')
    //   .arg(name)
    //   .execWithSpinner();
    // }

    await ProcessSpawner.create('make')
      .arg('preview')
      .execWithSpinner();

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
}
