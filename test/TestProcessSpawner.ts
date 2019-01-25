import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import { ProcessSpawner } from '../src/lib/ProcessSpawner';

describe('ProcessSpawner', () => {
  it('change opts, and cwd', () => {
    const ps: ProcessSpawner = new ProcessSpawner('ls');
    expect(ps.process).eq('ls', 'Correctly use process name');

    ps.arg('foo').arg('bar');
    expect(ps.args).eq('foo bar', 'Correctly register cmd arg');

    ps.chCwd('/tmp');
    expect(ps.cwd).eq('/tmp', 'Correctly change cwd');
  });

  it('execute `ls -l` in /tmp using chcwd', async () => {
    const ps: ProcessSpawner = new ProcessSpawner('/bin/ls');
    ps.chCwd('/tmp').arg('-l');
    const res: string[] = (await ps.exec()).split('\n');
    expect(res.length).least(3, 'Have at least 3 lines');

    const total: string = res[0];
    expect(total).include('total ');
  });

  it('execute `ls -ld /tmp`', async () => {
    const ps: ProcessSpawner = new ProcessSpawner('/bin/ls');
    const res: string = await ps.arg('-ld').arg('/tmp').exec();
    expect(res).contains('/tmp');
  });

  it('execute wrong cmd', async () => {
    const ps: ProcessSpawner = new ProcessSpawner('/fooo/bar');
    const res: string = await ps.exec().catch((err: Error) => {
      return '';
    });
    expect(res).eq('', 'Must be emptied by catch');
  });

  it('execute `ls /foo/bar` that doesn\'t exist', async () => {
    const ps: ProcessSpawner = new ProcessSpawner('/bin/ls').arg('/foo/bar');
    const res: string = await ps.exec().catch((err: Number | Error) => {
      return '';
    });
    expect(res).eq('', 'Must be emptied by catch');
  });
});
