import { expect } from 'chai';
import { describe, it } from 'mocha';

import { FilterLabels } from '../../src/commands/PullRequest/FilterLabels';

describe('Filter-Labels Command', () => {
  const cmd = new FilterLabels();

  it('filters labels for test', () => {
    const labels = ['test/mongodb', 'preview/es', 'testes'];
    const content: string[] = cmd['filterLabels'](labels, 'test');

    expect(content).to.eql(['mongodb']);
  })

  it('filters labels for preview', () => {
    const labels = ['test/mongodb', 'preview/es', 'testes', 'preview/mongodb'];
    const content: string[] = cmd['filterLabels'](labels, 'preview');

    expect(content).to.eql(['es', 'mongodb']);
  })

  it('filters all labels if nothing matches', () => {
    const labels = ['test/mongodb', 'preview/es', 'testes', 'preview/mongodb'];
    const content: string[] = cmd['filterLabels'](labels, 'unit-test');

    expect(content).length(0);
  })

});
