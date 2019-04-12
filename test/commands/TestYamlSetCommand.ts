import { expect } from 'chai';
import { describe, it } from 'mocha';
import { YAMLSetCommand } from '../../src/commands/Yaml/YamlSetCommand';
import { YamlModifier } from '../../src/lib/YamlModifier';
import tmp from 'tmp';

describe('YAML Set Command', () => {
  let newFile: string;

  beforeEach(() => {
    newFile = tmp.tmpNameSync({
      postfix: '.yaml'
    });
    new YamlModifier('./test/sample.yaml').write(newFile);
  });

  const cmd = new YAMLSetCommand();

  const args = {
    key: 'nuxeo.nuxeo.image.repository',
    value: 'DOCKER_REGISTRY',
    'file-path': '',
    $0: '',
    _: [],
  };

  it('check description', () => {
    expect(cmd.describe).equals('Set a value in a YAML file');
  });

  it('can add a new value', () => {
    args['file-path'] = newFile;
    args.key = 'nuxeo.new.value';
    args.value = 'NEW_VALUE';

    cmd['handler'](args);
    // Check the updated YAML file
    const newYml: YamlModifier = new YamlModifier(newFile);
    expect(newYml.content.nuxeo.new.value).eq('NEW_VALUE');
  });

  it('can edit existing value', () => {
    args['file-path'] = newFile;
    args.key = 'nuxeo.nuxeo.image.repository';
    args.value = 'REPO';

    cmd['handler'](args);
    // Check the updated YAML file
    const newYml: YamlModifier = new YamlModifier(newFile);
    expect(newYml.content.nuxeo.nuxeo.image.repository).eq('REPO');
  })
});