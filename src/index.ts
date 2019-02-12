import yargs, { Arguments } from 'yargs';

import { CleanupCommand } from './commands/CleanupCommand';
import { DummyCommand } from './commands/DummyCommand';
import { HelmCommand } from './commands/HelmCommand';
import { NuxeoCommand } from './commands/NuxeoCommand';

yargs
  .command(new DummyCommand())
  .command(new CleanupCommand())
  .command(new HelmCommand())
  .command(new NuxeoCommand())
  .option({
    'dry-run': {
      alias: ['n'],
      describe: 'Do not change anything in the system'
    }
  })
  .demandCommand()
  .recommendCommands()
  .epilogue('for more information, find our manual at https://github.com/nuxeo/nuxeo-jenkins-x-cli')
  .help('help')
  .showHelpOnFail(true)
  .parse();
