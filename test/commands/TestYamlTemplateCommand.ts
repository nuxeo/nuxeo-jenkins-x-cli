import { expect } from 'chai';
import { describe, it } from 'mocha';
import { YAMLTemplateCommand } from '../../src/commands/Yaml/YamlTemplateCommand';
import { YamlModifier } from '../../src/lib/YamlModifier';
import tmp from 'tmp';

describe('YAML Template Command', () => {

  let newFile: string;

  beforeEach(() => {
    newFile = tmp.tmpNameSync({
      postfix: '.yaml'
    });
    new YamlModifier('./test/sample-template.yaml').write(newFile);
  });

  const cmd = new YAMLTemplateCommand();

  it('can replace variables with values from env variables', () => {
    // Define the context
    const ctx = {
      DOCKER_REGISTRY: 'my-reg:5000',
      ORG: 'nuxeo',
      IMAGE: 'myimage',
    };
    // Check the updated YAML
    const newYaml: any = cmd['processTemplate'](newFile, ctx);
    expect(newYaml.nuxeo.nuxeo.image.repository).eq('my-reg:5000/nuxeo/myimage');
  });

  it('can\'t replace variable if the value doesn\'t exist', () => {
    // Define the context
    const ctx = {
      DOCKER_REGISTRY: 'my-reg:5000',
    };
    // Check the updated YAML
    const newYaml: any = cmd['processTemplate'](newFile, ctx);
    expect(newYaml.nuxeo.nuxeo.image.repository).eq('my-reg:5000//');
  });

  it('can replace variables with values from env variables in yaml file', () => {
    // Define the env variables
    process.env.DOCKER_REGISTRY = 'my-reg:5000';
    process.env.ORG = 'nuxeo';
    process.env.IMAGE = 'myimage'

    // Define the args for the command
    const args = {
      'file-path': newFile,
      $0: '',
      _: [],
    };
    // Check the updated YAML
    cmd['handler'](args);
    // Check the updated YAML file
    const newYaml: YamlModifier = new YamlModifier(newFile);
    expect(newYaml.content.nuxeo.nuxeo.image.repository).eq('my-reg:5000/nuxeo/myimage');
  });

});