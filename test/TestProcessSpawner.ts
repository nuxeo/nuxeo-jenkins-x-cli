import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Writable } from 'stream';
import { ProcessSpawner } from '../src/lib/ProcessSpawner';

describe('ProcessSpawner', () => {
  it('changes opts, and cwd', () => {
    const ps: ProcessSpawner = new ProcessSpawner('ls');
    expect(ps.process).eq('ls', 'Correctly use process name');

    ps.arg('foo').arg('bar');
    expect(ps.args).eq('foo bar', 'Correctly register cmd arg');

    ps.chCwd('/tmp');
    expect(ps.cwd).eq('/tmp', 'Correctly change cwd');

    expect(ps.cmd).eq('ls foo bar', 'Correctly compute full cmd');
  });

  it('can pipe stdout once', async () => {
    //cat /tmp/hello.world | grep h
    const fileInfo: ProcessSpawner = new ProcessSpawner('file').arg('-i').arg('-');
    const echo: ProcessSpawner = new ProcessSpawner('echo').arg('dummy-text').pipe(fileInfo);

    const res: string = await echo.exec();
    expect(res).contains('/dev/stdin');
  })

  it('executes `ls -l` in /tmp using chcwd', async () => {
    const ps: ProcessSpawner = new ProcessSpawner('/bin/ls');
    ps.chCwd('/tmp').arg('-l');
    const res: string[] = (await ps.exec()).split('\n');
    expect(res.length).least(3, 'Have at least 3 lines');

    const total: string = res[0];
    expect(total).include('total ');
  });

  it('executes `ls -ld /tmp`', async () => {
    const ps: ProcessSpawner = new ProcessSpawner('/bin/ls');
    const res: string = await ps.arg('-ld').arg('/tmp').exec();
    expect(res).contains('/tmp');
  });

  it('Displays spinner correctly', async () => {
    /**
     * Create custom Writable to be able to test spinner return
     */
    let output: string = '';
    class StrWriter extends Writable {
      /* tslint:disable */
      public _write(chunk: Buffer, encoding: string, done: () => void): void {
        output = chunk.toString().trim();
      }
    }

    const ps: ProcessSpawner = new ProcessSpawner('/bin/ls');
    await ps.arg('-ld').arg('/tmp').execWithSpinner({
      stream: new StrWriter(),
    });
    expect(output).eq('- Executing: /bin/ls -ld /tmp');

    await ps.execWithSpinner({
      stream: new StrWriter(),
      text: 'test'
    });
    expect(output).eq('- test');
  });

  it('executes wrong cmd', async () => {
    const ps: ProcessSpawner = new ProcessSpawner('/fooo/bar');
    const res: string = await ps.exec().catch((err: Error) => {
      return '';
    });
    expect(res).eq('', 'Must be emptied by catch');
  });

  it('executes `ls /foo/bar` that doesn\'t exist', async () => {
    const ps: ProcessSpawner = new ProcessSpawner('/bin/ls').arg('/foo/bar');
    const res: string = await ps.exec().catch((err: Number | Error) => {
      return '';
    });
    expect(res).eq('', 'Must be emptied by catch');
  });

  it('takes care of environment variables', async () => {
    const ps: ProcessSpawner = new ProcessSpawner('env').env('FOO', 'bar').env('BAR', 'foo');
    expect(ps.envs).eq('FOO=bar;BAR=foo');

    const res: string = await ps.exec();
    expect(res).match(new RegExp('^FOO=bar$', 'm')).match(new RegExp('^BAR=foo$', 'm'));
  });
});
