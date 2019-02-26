import yargs from 'yargs';

import { CleanupCommand } from './commands/CleanupCommand';
import { HelmCommand } from './commands/HelmCommand';
import { NuxeoCommand } from './commands/NuxeoCommand';
import { PRCommand } from './commands/PRCommand';
import { PreviewCommand } from './commands/PreviewCommand';

yargs
  .command(new CleanupCommand())
  .command(new HelmCommand())
  .command(new NuxeoCommand())
  .command(new PRCommand())
  .command(new PreviewCommand())
  .option({
    'dry-run': {
      describe: 'Do not change anything in the system',
      default: false,
      type: 'boolean'
    }
  })
  .demandCommand()
  .recommendCommands()
  .epilogue('for more information, find our manual at https://github.com/nuxeo/nuxeo-jenkins-x-cli')
  .help('help')
  .showHelpOnFail(true)
  .parse();
