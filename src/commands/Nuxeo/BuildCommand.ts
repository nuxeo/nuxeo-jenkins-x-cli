import debug from 'debug';
import { Arguments, Argv, CommandModule } from 'yargs';
import { ProcessSpawner } from '../../lib/ProcessSpawner';

const log: debug.IDebugger = debug('command:nuxeo:build');

/**
 * Nuxeo Build Command that lets you build a Docker image and publishing it
 */
export class BuildCommand implements CommandModule {
  public command: string = 'build';

  public describe: string = 'Build and Publish Docker image. Using Scaffold.';

  public builder: (args: Argv) => Argv = (args: Argv) => {
    args.option({
      tag: {
        describe: 'Docker Image\'s version to build',
        type: 'string',
        required: true
      },
      registry: {
        describe: 'Docker\'s registry',
        type: 'string',
      },
      organization: {
        describe: 'Docker\'s organization',
        type: 'string',
      },
      name: {
        describe: 'Docker\'s image name',
        type: 'string',
        required: true
      },
    });

    return args;
  }

  public handler = async (args: Arguments): Promise<void> => {
    log(args);

    const skaffold: ProcessSpawner = ProcessSpawner.create('skaffold')
      .env('DOCKER_IMAGE', this.formatDockerImageName(args))
      .env('VERSION', `${args.tag}`);

    if (args.registry !== undefined) {
      skaffold.env('DOCKER_REGISTRY', `${args.registry}`);
    }
    await skaffold.execWithSpinner();

    await ProcessSpawner.create('jx')
      .arg('step').arg('post').arg('build')
      .arg('--image').arg(this.formatDockerImageFullName(args))
      .execWithSpinner();

    return Promise.resolve();
  }

  protected formatDockerImageFullName = (args: Arguments): string => {
    const reg: string | unknown = args.registry === undefined ? process.env.DOCKER_REGISTRY : args.registry;

    return `${reg}/${this.formatDockerImageName(args)}:${args.tag}`;
  }

  protected formatDockerImageName = (args: Arguments): string => {
    if (args.organization !== undefined) {
      return `${args.organization}/${args.name}`;
    }

    return `${args.name}`;
  }
}
