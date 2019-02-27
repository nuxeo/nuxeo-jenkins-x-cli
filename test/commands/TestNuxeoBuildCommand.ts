import { expect } from 'chai';
import { describe, it } from 'mocha';
import { BuildCommand } from '../../src/commands/Nuxeo/BuildCommand';


describe('Build Command', () => {
  const cmd = new BuildCommand();

  const args = {
    registry: 'toto:5000',
    tag: 'latest',
    name: 'foo',
    organization: 'bar',
    $0: '',
    _: [],
  }

  it('assembles Docker image name', () => {
    let res: string = cmd['formatDockerImageName'](args);
    expect(res).eq('bar/foo');

    res = cmd['formatDockerImageName']({ ...args, organization: undefined });
    expect(res).eq('foo');
  });

  it('assembles Docker image full name', () => {
    let res: string = cmd['formatDockerImageFullName'](args);
    expect(res).eq('toto:5000/bar/foo:latest');

    res = cmd['formatDockerImageFullName']({ ...args, organization: undefined, tag: '1.0', registry: 'local:5000' });
    expect(res).eq('local:5000/foo:1.0');
  });
});
