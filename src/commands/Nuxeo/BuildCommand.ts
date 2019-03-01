import debug from 'debug';
import { Arguments, Argv, CommandModule } from 'yargs';
import { Helper } from '../../lib/Helper';
import { ProcessSpawner } from '../../lib/ProcessSpawner';

const log: debug.IDebugger = debug('command:nuxeo:build');

/**
 * Nuxeo Build Command that lets you build a Docker image and publishing it
 */
export class BuildCommand implements CommandModule {
  public command: string = 'build';

  public describe: string = 'Build and Publish Docker image. Using Skaffold.';

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
      .arg('build').arg('-f').arg('skaffold.yaml')
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
    return Helper.formatDockerImageFull(args.registry, args.organization, args.name, args.tag);
  }

  protected formatDockerImageName = (args: Arguments): string => {
    return Helper.formatDockerImage(args.organization, args.name);
  }
}
