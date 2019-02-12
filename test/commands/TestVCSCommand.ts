import { expect } from 'chai';
import { describe, it } from 'mocha';

import fs from 'fs';
import path from 'path';
import tmp, { SynchrounousResult } from 'tmp';
import { VCSCommand } from '../../src/commands/Nuxeo/VCSCommand';

describe('VCS Command', () => {
  const cmd = new VCSCommand();

  it('formats properties', () => {
    const content: string[] = cmd['generateContent']('base', {
      key1: 'value1',
      key2: 'value2',
    }, true);

    expect(content).lengthOf(3);
    expect(content.join('\n')).eq('base.key1=value1\nbase.key2=value2\n');
  });

  it('create file content', () => {
    const tmpDir: SynchrounousResult = tmp.dirSync();
    const tmpFile: string = path.join(tmpDir.name, 'tmp-' + Math.floor(Math.random() * 1000000) + '.tmp');

    cmd['writePropertiesFile'](tmpFile, 'data');

    let c: String = fs.readFileSync(tmpFile, 'utf-8');
    expect(c).eq('data');

    cmd['writePropertiesFile'](tmpFile, 'data-2', true);
    c = fs.readFileSync(tmpFile, 'utf-8');
    expect(c).eq('data-2');
  });

  it('ensures file exist', () => {
    const tmpDir: SynchrounousResult = tmp.dirSync();
    const tmpFile: string = path.join(tmpDir.name, 'tmp-' + Math.floor(Math.random() * 1000000) + '.tmp');

    cmd['writePropertiesFile'](tmpFile, 'data');

    try {
      cmd['writePropertiesFile'](tmpFile, 'data-2');
      expect.fail('Error should have been thrown.');
    } catch (err) {
      // Nothing to do.
    }
  });
});
