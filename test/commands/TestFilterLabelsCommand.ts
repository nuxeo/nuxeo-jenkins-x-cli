import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Arguments } from 'yargs';

import { FilterLabels } from '../../src/commands/PullRequest/FilterLabels';

describe('Filter-Labels Command', () => {
  const cmd = new FilterLabels();

  it('filters labels for test', () => {
    const args: Arguments = {
      _: ['pr', 'filter-labels'],
      mode: 'test',
      labels: ['test/mongodb', 'preview/es', 'testes'],
      '$0': 'src/index.ts',
    };
    const content: string[] = cmd.handler(args);

    expect(content).to.eql(['mongodb']);
  })

  it('filters labels for preview', () => {
    const args: Arguments = {
      _: ['pr', 'filter-labels'],
      mode: 'preview',
      labels: ['test/mongodb', 'preview/es', 'testes', 'preview/mongodb'],
      '$0': 'src/index.ts',
    };
    const content: string[] = cmd.handler(args);

    expect(content).to.eql(['es', 'mongodb']);
  })

  it('filters all labels if nothing matches', () => {
    const args: Arguments = {
      _: ['pr', 'filter-labels'],
      mode: 'unittest',
      labels: ['test/mongodb', 'preview/es', 'testes', 'preview/mongodb'],
      '$0': 'src/index.ts',
    };
    const content: string[] = cmd.handler(args);

    expect(content).length(0);
  })

});
