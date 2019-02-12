import yargs, { Arguments } from 'yargs';

import { CleanupCommand } from './commands/CleanupCommand';
import { HelmCommand } from './commands/HelmCommand';
import { PresetCommand } from './commands/Nuxeo/PresetCommand';
import { PreviewCommand } from './commands/Nuxeo/PreviewCommand';
import { NuxeoCommand } from './commands/NuxeoCommand';

yargs
  .command(new CleanupCommand())
  .command(new HelmCommand())
  .command(new NuxeoCommand())
  .command(new PresetCommand())
  .command(new PreviewCommand())
  .option({
    'dry-run': {
      describe: 'Do not change anything in the system'
    }
  })
  .demandCommand()
  .recommendCommands()
  .epilogue('for more information, find our manual at https://github.com/nuxeo/nuxeo-jenkins-x-cli')
  .help('help')
  .showHelpOnFail(true)
  .parse();
