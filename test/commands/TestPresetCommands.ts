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
    expect(cmd['transform']('test-namespace')).eq('test-namespace');
    expect(cmd['transform']('test-a-really-really-really-long-namespace-with-more-than-64-characters-mongodb'))
      .eq('test-a-really-really-really-long-more-than-64-characters-mongodb');
    expect(cmd['transform']('test-A-really-really-REALLY-long-namespace-with-MoRe-than-64-characters-postgresql'))
      .eq('test-a-really-really-really-long-e-than-64-characters-postgresql');
  });
});
