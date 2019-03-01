import cliTruncate from 'cli-truncate';

interface IHelper {
  formatDockerImage(org: unknown, name: unknown): string;
  formatDockerImageFull(registry: unknown, org: unknown, name: unknown, tag?: unknown): string;
  formatNamespace(namespace: string, ellipsis?: string): string;
}

const Helper: IHelper = {
  formatDockerImage: (org: unknown, name: unknown): string => {
    return [org, name].filter((v: unknown) => v !== undefined).join('/');
  },

  formatDockerImageFull: (registry: unknown = process.env.DOCKER_REGISTRY, org: unknown, name: unknown, tag?: string): string => {
    const dockerImage: string = `${registry}/${Helper.formatDockerImage(org, name)}`;

    return tag === undefined ? dockerImage : `${dockerImage}:${tag}`;
  },

  formatNamespace: (namespace: string, ellipsis: string = '-'): string => {
    if (typeof namespace !== 'string') {
      throw new Error('Wrong namespace type');
    }

    // Truncate the label in the middle
    const trucatedNs: string = cliTruncate(namespace.toLocaleLowerCase(), 64, { position: 'middle' });

    return trucatedNs.replace('…', ellipsis);
  }
};

export { Helper };
