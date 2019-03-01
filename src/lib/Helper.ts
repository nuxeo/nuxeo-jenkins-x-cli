
interface IHelper {
  formatDockerImage(org: unknown, name: unknown): string;
  formatDockerImageFull(registry: unknown, org: unknown, name: unknown, tag?: unknown): string;
}

const Helper: IHelper = {
  formatDockerImage: (org: unknown, name: unknown): string => {
    return [org, name].filter((v: unknown) => v !== undefined).join('/');
  },

  formatDockerImageFull: (registry: unknown = process.env.DOCKER_REGISTRY, org: unknown, name: unknown, tag?: string): string => {
    const dockerImage: string = `${registry}/${Helper.formatDockerImage(org, name)}`;

    return tag === undefined ? dockerImage : `${dockerImage}:${tag}`;
  }
};

export { Helper };
