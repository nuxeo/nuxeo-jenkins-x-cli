import yargs from 'yargs';

import { CleanupCommand } from './commands/CleanupCommand';
import { DummyCommand } from './commands/DummyCommand';

yargs
  .command(new DummyCommand())
  .command(new CleanupCommand())
  .option({
    namespace: {
      alias: ['n'],
      describe: 'Target Kubernetes namespace'
    }
  })
  .demandCommand()
  .recommendCommands()
  .epilogue('for more information, find our manual at https://github.com/nuxeo/nuxeo-jenkins-x-cli')
  .help('info')
  // .showHelpOnFail(false, 'Specify --help for available options')
  .parse();
