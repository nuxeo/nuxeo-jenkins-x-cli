import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Helper } from '../src/lib/Helper';

describe('Helper', () => {
  it('formats docker image', () => {
    let txt:string = Helper.formatDockerImage('myorg', 'image');
    expect(txt).equal('myorg/image');

    txt = Helper.formatDockerImage(undefined, 'image');
    expect(txt).equal('image');
  });

  it('formats docker fullname image', () => {
    process.env['DOCKER_REGISTRY'] = 'my-reg:5000';

    let txt:string = Helper.formatDockerImageFull(undefined, 'org', 'image');
    expect(txt).equal('my-reg:5000/org/image');

    txt = Helper.formatDockerImageFull('nd-reg:5000', 'org', 'image', 'latest');
    expect(txt).equal('nd-reg:5000/org/image:latest');
  });

  it('truncate long namespace by the middle', () => {
    expect(Helper.formatNamespace('lilalou')).eq('lilalou');

    const toolongNs = (Math.random()*1e128).toString(36);
    expect(toolongNs.length).not.lessThan(70);
    expect(Helper.formatNamespace(toolongNs)).lengthOf(64);
  });
});
