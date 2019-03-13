import debug from 'debug';
import fs from 'fs';
import yaml from 'js-yaml';
import _ from 'lodash';

const log: debug.IDebugger = debug('yaml');
/**
 * Manipulate YAML file
 */
// tslint:disable:no-any
// tslint:disable:non-literal-fs-path
export class YamlModifier {
  protected yaml: any;
  protected filePath: string;

  constructor(filePath: string) {

    if (!fs.existsSync(filePath)) {
      log(`File ${filePath} is unknown.`);

      throw new Error(`File ${filePath} doesn't exist.`);
    }

    // tslint:disable-next-line:non-literal-fs-path
    this.yaml = yaml.load(fs.readFileSync(filePath, 'UTF-8'));
    this.filePath = filePath;
  }

  /**
   * Set Yaml value using his key. See https://lodash.com/docs/4.17.10#set for syntax
   *
   * @param path where to save the value, missing child are created automatically
   * @param value to set
   */
  public setValue(path: string, value: any): YamlModifier {
    _.set(this.yaml, path, value);

    return this;
  }

  /**
   * Change Yaml file root node to a child node, all sibling nodes are lost.
   *
   * @param path of the new root, key is rebased as root.
   */
  public reRoot(path: string): YamlModifier {
    this.yaml = _.get(this.yaml, path);

    return this;
  }

  get content(): any {
    return { ...this.yaml };
  }

  public write(filePath: string = this.filePath, force: boolean = false): void {
    if (filePath !== this.filePath && fs.existsSync(filePath) && !force) {
      throw new Error(`File ${filePath} already exists, you should force to override it.`);
    }

    const flag: string = (force ? 'w' : 'wx');
    fs.writeFileSync(filePath, yaml.dump(this.yaml), { flag });
  }
}
