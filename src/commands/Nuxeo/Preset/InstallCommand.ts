import debug from 'debug';
import { Arguments, CommandModule } from 'yargs';
import { ProcessSpawner } from '../../../lib/ProcessSpawner';

const log: debug.IDebugger = debug('command:nuxeo:preset:install');

/**
 * Nuxeo Preset Install Command - Install&Configure Nuxeo Preset
 */
export class InstallCommand implements CommandModule {
  public command: string = 'install';

  public describe: string = 'Install and Configure a preset';

  // tslint:disable:no-any
  public handler = async (args: Arguments): Promise<string> => {
    if (args._nx === 'undefined' || args._nx === null) {
      return Promise.reject('Unable to parse corresponding yaml file');
    }

    const nxArgs: any = args._nx;
    const preset: any = nxArgs.yml;

    log(preset);
    // Initialize customdb vcs configuration
    const psp: ProcessSpawner = ProcessSpawner.createSub(args).arg('nuxeo').arg('vcs');
    if (preset.nuxeo.vcs.core !== undefined) {
      psp.arg('--core').arg(preset.nuxeo.vcs.core);
    }

    psp.arg('-b').arg(preset.nuxeo.vcs.base);
    Object.keys(preset.nuxeo.vcs.properties).forEach((elt: string) => {
      psp.arg(`-p.${elt}`).arg(`${preset.nuxeo.vcs.properties[elt]}`);
    });

    return psp.execWithSpinner().then(async () => {
      return ProcessSpawner.createSub(args)
        .arg('helm')
        .arg('install')
        .arg('--name').arg(args.name)
        .arg(preset.helm.chart)
        .execWithSpinner();
    }).then(async () => {
      return preset.nuxeo.templates.join(',');
    });
  }
}
