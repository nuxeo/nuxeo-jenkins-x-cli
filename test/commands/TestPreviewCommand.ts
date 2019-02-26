import {expect} from 'chai';
import {describe, it} from 'mocha';
import { PreviewCommand } from '../../src/commands/PreviewCommand';

describe('Preview Command', () => {
  const cmd = new PreviewCommand();

  it('check description', () => {
    expect(cmd.describe).equals('Run a preview based on preset');
  });
});
