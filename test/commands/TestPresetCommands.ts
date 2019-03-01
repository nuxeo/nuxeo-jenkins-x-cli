import { expect } from 'chai';
import { describe, it } from 'mocha';
import { PresetCommand } from '../../src/commands/Nuxeo/PresetCommand';
//import fs from 'fs';
import path from 'path';

describe('Preset Command', () => {
  const cmd = new PresetCommand();

  const findPresetPath = (name: string): string => {
    if (require.main === undefined) {
      throw new Error('Poumip');
    }
    return path.join(path.dirname(__filename), '..', '..', 'src', 'presets', `${name}.yml`);
  };

  it('throw exception if file is missing', () => {
    try {
      cmd['readYaml']('/tmp/foo_bar_123');
      expect.fail('Should thorw exception');
    } catch (err) {
      // XXX Nothing to do
    }
  });

  it('parse correctly random yaml file', () => {
    const preset: any = cmd['readYaml'](findPresetPath('mongodb'));
    expect(preset.helm.chart).eq('local-jenkins-x/nuxeo-mongodb');
    expect(preset.nuxeo.vcs.properties.server).eq('mongodb://..svc.cluster.local');
  });

  it('render variables in yaml file', () => {
    const preset: any = cmd['readYaml'](findPresetPath('mongodb'), {
      APP_NAME: 'mongodb',
      NAMESPACE: 'nuxeal'
    });

    expect(preset.nuxeo.vcs.properties.server).eq('mongodb://mongodb.nuxeal.svc.cluster.local');
  });

  it('transform namespace if length is more than 64 chars', () => {
    const args: any = {
      _: [],
      $0: ''
    }

    let tmp: any = { ...args, namespace: 'test-ns', name: 'name' };
    cmd['defineNamespace'](tmp);
    expect(tmp).property('namespace', 'test-ns-name');

    tmp = { ...args, namespace: 'test-a-really-really-really-long-namespace-with-more-than-64-characters', name: 'mongodb' };
    cmd['defineNamespace'](tmp)
    expect(tmp).property('namespace', 'test-a-really-really-really-long-more-than-64-characters-mongodb');

    tmp = { ...args, namespace: 'test-A-really-really-REALLY-long-namespace-with-MoRe-than-64-characters', name: 'postgres' };
    cmd['defineNamespace'](tmp)
    expect(tmp).property('namespace', 'test-a-really-really-really-long-ore-than-64-characters-postgres');
  });
});
