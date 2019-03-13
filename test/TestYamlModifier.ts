import { expect } from 'chai';
import { describe, it } from 'mocha';
import { YamlModifier } from '../src/lib/YamlModifier';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fail } from 'assert';

describe('YamlModifier', () => {
  let yml: YamlModifier;
  before(() => {
    yml = new YamlModifier('./test/sample.yaml');
  });

  it('can only open exising file', () => {
    try {
      new YamlModifier('/foo/barr/random/kidding/notpossible/hihi');
      fail('Should have throw an exception if file doesn\'t exist');
    } catch (err) {
      // Nothing to do
    }
  });

  it('can load a yaml file', () => {
    expect(yml.content.nuxeo.fullnameOverride).equal('preview');
  });

  it('can edit a value', () => {
    expect(yml.content.nuxeo.nuxeo.image.repository).is.null;

    yml.setValue('nuxeo.nuxeo.image.repository', 'DOCK_REG')
      .setValue('nuxeo.nuxeo.image.version', '0.0.0');

    expect(yml.content.nuxeo.nuxeo.image.repository).eq('DOCK_REG');
    expect(yml.content.nuxeo.nuxeo.image.version).eq('0.0.0');
  });

  it('can add a value', () => {
    expect(yml.content.nuxeo).not.contains.keys(['dummy']);
    expect(yml.content.nuxeo).contains.keys(['nuxeo']);

    yml.setValue('nuxeo.dummy.foo.bar', 'Did it!');
    expect(yml.content.nuxeo.dummy.foo.bar).equal('Did it!');
  });

  it('can change yaml root', () => {
    expect(yml.content.nuxeo.fullnameOverride).equal('preview');
    yml.reRoot('nuxeo.nuxeo.image');

    expect(yml.content.pullPolicy).equal('Always');
  });

  describe('can write', () => {

    let newFile: string;
    before(() => {
      const tmpDir: string = fs.mkdtempSync(path.join(os.tmpdir(), 'njx-'));
      newFile = path.join(tmpDir, 'my-new.yaml');
    });

    it('content in a file', () => {
      yml.setValue('nuxeo.nuxeo.image.repository', 'DOCK_REG')
        .setValue('nuxeo.nuxeo.image.version', '0.0.0')
        .setValue('nuxeo.dummy.foo.bar', 'Did it!')
        .write(newFile);

      const newYml: YamlModifier = new YamlModifier(newFile);
      expect(newYml.content.nuxeo.nuxeo.image.repository).eq('DOCK_REG');
      expect(newYml.content.nuxeo.dummy.foo.bar).equal('Did it!');
    });

    it('only in not existing file', () => {
      try {
        yml.write(newFile);
        yml.write(newFile);
        fail('Should not write twice the same file');
      } catch (err) {
        // Nothing to do
      }

      yml.write(newFile, true);
    });
  });
});
