# Nuxeo Jenkins X CLI

## Work In Progress

[![Dependency Status](https://img.shields.io/david/nuxeo/nuxeo-jenkins-x-cli.svg?style=flat-square)](https://david-dm.org/nuxeo/nuxeo-jenkins-x-cli) [![devDependency Status](https://img.shields.io/david/dev/nuxeo/nuxeo-jenkins-x-cli.svg?style=flat-square)](https://david-dm.org/nuxeo/nuxeo-jenkins-x-cli#info=devDependencies)

## About

Nuxeo Jenkins-X CLI is a command-line interface for helping developers with wrappers around common commands that leverage Jenkins-X, or Kubernetes features.

## Installation

```bash
npm install nuxeo/nuxeo-jenkins-x-cli#master
```

## Development

```bash
git clone nuxeo/nuxeo-jenkins-x-cli && cd $_
yarn install

yarn start <your command...> # Pass your commands to the CLI.
yarn prepare # Transpile TS into ES2015 for NodeJS compatibility.
```

Note that the project is using [husky](https://github.com/typicode/husky) in order to enforce code quality with local Github hooks.

- `precommit`: requires a valid linted commit
- `prepush`: requires to have lint + tests valid

## Usage

```text
njx <command>

Commands:
  njx helm     Entrypoint for helm commands
  njx nuxeo    Entrypoint for Nuxeo commands
  njx pr       Entrypoint for PR commands
  njx preview  Run a preview based on preset

Options:
  --version  Show version number                                       [boolean]
  --dry-run  Do not change anything in the system     [boolean] [default: false]
  --help     Show help                                                 [boolean]

for more information, find our manual at
https://github.com/nuxeo/nuxeo-jenkins-x-cli
```

## Debug & Dry Run

Every commands are somehow tied to Jenkins-X and Kubernetes environment, tools, etc. In order to check what each command does internally, we strongly recommend you to rely on `dry-run` mode with `debug` output (based on the overused [Debug package](https://www.npmjs.com/package/debug)).

For instance, running `DEBUG=* njx --dry-run preset install mongodb` outputs:

```text
  command:nuxeo:preset { nuxeo:
  command:nuxeo:preset    { templates: [ 'customdb', 'mongodb', 'qa' ],
  command:nuxeo:preset      vcs:
  command:nuxeo:preset       { core: 'mongo',
  command:nuxeo:preset         base: 'nuxeo.test.mongodb',
  command:nuxeo:preset         properties: [Object] } },
  command:nuxeo:preset   helm: { chart: 'local-jenkins-x/nuxeo-mongodb' } } +0ms
  command:nuxeo:preset:install { nuxeo:
  command:nuxeo:preset:install    { templates: [ 'customdb', 'mongodb', 'qa' ],
  command:nuxeo:preset:install      vcs:
  command:nuxeo:preset:install       { core: 'mongo',
  command:nuxeo:preset:install         base: 'nuxeo.test.mongodb',
  command:nuxeo:preset:install         properties: [Object] } },
  command:nuxeo:preset:install   helm: { chart: 'local-jenkins-x/nuxeo-mongodb' } } +0ms
✔ Executing: /Users/arnaud/Nuxeo/sources/nuxeo-jenkins-x-cli/lib/njx.js --dry-run nuxeo vcs --core mongo -b nuxeo.test.mongodb -p.server="mongodb://.undefined-mongodb.svc.cluster.local" -p.dbname="vcstest" /Users/arnaud/nuxeo-test-vcs-mongodb.properties
✔ Executing: /Users/arnaud/Nuxeo/sources/nuxeo-jenkins-x-cli/lib/njx.js --dry-run helm install --name undefined-mongodb --namespace undefined-mongodb local-jenkins-x/nuxeo-mongodb
customdb,mongodb,qa
```

## Sample

A sample `Jenkinsfile` relying on `njx` can be found in [https://github.com/nuxeo-sandbox/nuxeo/blob/test-jx-gildas/Jenkinsfile](https://github.com/nuxeo-sandbox/nuxeo/blob/test-jx-gildas/Jenkinsfile).

### Commands

#### Helm

Wrapper around [Helm](https://helm.sh/) CLI that ensures a `local-jenkins-x` repository is configured, which should be linked to your local Jenkins-X Help chart museum (`http://jenkins-x-chartmuseum:8080`).

Middleware:

- `helm init --client-only`
- `helm repo add local-jenkins-x http://jenkins-x-chartmuseum:8080`

Help:

```text
njx helm

Entrypoint for helm commands

Commands:
  njx helm install <chart>  Install chart from Jenkins-X Museum
  njx helm cleanup          Cleanup chart with name and his namespace

Options:
  --version        Show version number                                 [boolean]
  --dry-run        Do not change anything in the system
                                                      [boolean] [default: false]
  --help           Show help                                           [boolean]
  --repo-host, -h  Chart Museum Repository to use
                                  [default: "http://jenkins-x-chartmuseum:8080"]
  --namespace, -n  Target Kubernetes namespace.                       [required]
```

##### Helm Install

Install a remote Helm Chart in a target namespace.

Internal Command:

- `helm install --name <install_name> --namespace <namespace> <chart_to_deploy>`

Help:

```text
njx helm install <chart>

Install chart from Jenkins-X Museum

Options:
  --version        Show version number                                 [boolean]
  --dry-run        Do not change anything in the system
                                                      [boolean] [default: false]
  --help           Show help                                           [boolean]
  --repo-host, -h  Chart Museum Repository to use
                                  [default: "http://jenkins-x-chartmuseum:8080"]
  --namespace, -n  Target Kubernetes namespace.                       [required]
  --name                                                     [string] [required]
```

##### Helm Cleanup

Uninstall and purge a Chart then remove the target namespace.

Internal Commands:

- `helm delete <name> --purge`
- `kubectl delete ns <namespace>`

Help:

```text
njx helm cleanup

Cleanup chart with name and his namespace

Options:
  --version        Show version number                                 [boolean]
  --dry-run        Do not change anything in the system
                                                      [boolean] [default: false]
  --help           Show help                                           [boolean]
  --repo-host, -h  Chart Museum Repository to use
                                  [default: "http://jenkins-x-chartmuseum:8080"]
  --namespace, -n  Target Kubernetes namespace.                       [required]
  --name                                                     [string] [required]
```

#### Nuxeo

Nuxeo related commands

Help:

```text
njx nuxeo

Entrypoint for Nuxeo commands

Commands:
  njx nuxeo vcs <file>  Initiate Nuxeo VCS properties file
  njx nuxeo preset      Entrypoint for Nuxeo Preset commands
  njx nuxeo build       Build and Publish Docker image. Using Skaffold.

Options:
  --version  Show version number                                       [boolean]
  --dry-run  Do not change anything in the system     [boolean] [default: false]
  --help     Show help                                                 [boolean]
```

##### Nuxeo VCS

Create a VCS Configuration file by passing values as command options.

```text
njx nuxeo vcs <file>

Initiate Nuxeo VCS properties file

Options:
  --version         Show version number                                [boolean]
  --dry-run         Do not change anything in the system
                                                      [boolean] [default: false]
  --help            Show help                                          [boolean]
  --properties, -p  Property's values. Use dots (.) for implicit object path.
                                                        [required] [default: {}]
  --force           Override existing file.           [boolean] [default: false]
  --core            Nuxeo Test Core
  --base, -b        Change properties base. [string] [default: "nuxeo.test.vcs"]
  --append, -a      Append generated content to the target file.
                                                    [boolean] [default: "false"]
  --no-header       Remove header from generated properties file.
                                                    [boolean] [default: "false"]

Examples:
  njx nuxeo vcs -p.server localhost -p.db   Generates a
  my-DB nuxeo-test-vcs.properties           `nuxeo-test-vcs.properties` file
                                            with two
                                            lines:`nuxeo.test.vcs.db=my-DB` and
                                            `nuxeo.test.vcs.server=localhost`.
```

##### Nuxeo Build

Build and publish a Docker Image using Skaffold.

Internal Commands:

- `skaffold build -f skaffold.yaml`
- `jx step post build --image <DOCKER_REGISTRY>/<ORGANIZATION>/<IMAGE_NAME>:<IMAGE_TAG>`

Help:

```text
njx nuxeo build

Build and Publish Docker image. Using Skaffold.

Options:
  --version       Show version number                                  [boolean]
  --dry-run       Do not change anything in the system[boolean] [default: false]
  --help          Show help                                            [boolean]
  --tag           Docker Image's version to build            [string] [required]
  --registry      Docker's registry                                     [string]
  --organization  Docker's organization                                 [string]
  --name          Docker's image name                        [string] [required]
```

##### Nuxeo Preset

Commands for deploying a Nuxeo preset in Kubernetes. Available presets can be found in [presets](https://github.com/nuxeo/nuxeo-jenkins-x-cli/tree/master/src/presets) folder in sources.

A preset is a [Mustache](https://mustache.github.io/) template that relies on environment variables as resolution context.

Sample Preset:

```yml
helm:
  chart: local-jenkins-x/nuxeo-mongodb
nuxeo:
  templates:
    - customdb
    - mongodb
    - qa
  vcs:
    core: mongo
    base: nuxeo.test.mongodb
    properties:
      server: mongodb://{{APP_NAME}}.{{NAMESPACE}}.svc.cluster.local
      dbname: vcstest
```

- `helm.chart` defines which chart needs to be deployed
- `nuxeo.templates` defines what templates need to be activated by Maven
- `vsc.*` are passed to `njx nuxeo vcs` command to generate VCS Test file.

##### Nuxeo Preset Install

Install and Configure a preset, and output Maven templates that needs to be activated.

Sample:

```text
$ njx nuxeo preset install --name mongodb --dry-runs
✔ Executing: /Users/arnaud/Nuxeo/sources/nuxeo-jenkins-x-cli/lib/njx.js --dry-run nuxeo vcs --core mongo -b nuxeo.test.mongodb -p.server="mongodb://.ns-mongodb.svc.cluster.local" -p.dbname="vcstest" /Users/arnaud/nuxeo-test-vcs-mongodb.properties
✔ Executing: /Users/arnaud/Nuxeo/sources/nuxeo-jenkins-x-cli/lib/njx.js --dry-run helm install --name ns-mongodb --namespace ns-mongodb local-jenkins-x/nuxeo-mongodb
customdb,mongodb,qa
```

Help:

```text
njx nuxeo preset install

Install and Configure a preset

Options:
  --version    Show version number                                     [boolean]
  --dry-run    Do not change anything in the system   [boolean] [default: false]
  --help       Show help                                               [boolean]
  --name       Preset's name.                                         [required]
  --namespace  Base namespace to deploy                      [string] [required]
```

##### Nuxeo Preset Purge

Cleanup preset installation. For now, it only trigger a `njx helm cleanup` command to uninstall the installed chart.

Help:

```text
njx nuxeo preset purge

purge a preset

Options:
  --version    Show version number                                     [boolean]
  --dry-run    Do not change anything in the system   [boolean] [default: false]
  --help       Show help                                               [boolean]
  --name       Preset's name.                                         [required]
  --namespace  Base namespace to deploy                      [string] [required]
```

#### PR Filter-Labels

Parse Github labels for having test or preview environment to deploy.

Help:

```text
njx pr filter-labels

Filter the labels for the given mode (test or preview)

Options:
  --version     Show version number                                    [boolean]
  --dry-run     Do not change anything in the system  [boolean] [default: false]
  --help        Show help                                              [boolean]
  --mode, -m    The type of labels to filter, either `test` or `preview`
                                                 [required] [default: "preview"]
  --labels, -l  The list of labels to filter                  [array] [required]

Examples:
  njx pr filter-labels -m test -l           Filter the labels from the given
  test/mongodb test/postgres                list only for the `test` mode
  preview/mongodb
```

#### Kubernetes Copy

Copy one Kubernetes resource from one namespace to another one.

Help:

```text
njx k8s copy <resource> <name>

Copy K8s resource from one namespace to another one

Options:
  --version  Show version number                                       [boolean]
  --dry-run  Do not change anything in the system     [boolean] [default: false]
  --help     Show help                                                 [boolean]
  --from     Source resource namespace                       [string] [required]
  --to       Target resource namespace                       [string] [required]
```

#### Preview

Deploys a Jenkins-X Preview in the target namespace. Configure and install local `preview` chart (Default: `charts/preview` folder) based on default Jenkins-X behaviors:

- Appends freshly build Docker Image references (based on `${DOCKER_REGISTRY}/${ORG}/${APP_NAME}:${PREVIEW_VERSION}`).
- Align Helm Chart's version on `${PREVIEW_VERSION}` number.
- Template Helm Chart before deploy using `jx step helm build`
- Copy either secrets and config maps (from opts `--copy-secret` and `--copy-configmap`) from cluster namespace (using `jx ns -b`) to preview's namespace using `njx k8s copy` cmd.
- Deploy Chart as a Jenkins-X Preview using `jx preview --name ${APP_NAME} --namespace ${NAMESPACE}` which leads to add a comment in the associated PR with the preview URL (Can be disabled using `--comment=false` option).

Help:

```text
njx preview

Run a preview based on preset

Options:
  --version         Show version number                                [boolean]
  --dry-run         Do not change anything in the system
                                                      [boolean] [default: false]
  --help            Show help                                          [boolean]
  --tag             Docker image's tag to deploy.            [string] [required]
  --organization    Docker image's organization to deploy.   [string] [required]
  --build           Preview build version.                   [string] [required]
  --comment         Skip the comment on PR             [boolean] [default: true]
  --log-level       Log level (ex: debug)            [string] [default: "debug"]
  --copy-secret     K8S Secret to copy                     [array] [default: []]
  --copy-configmap  K8S Config Map to copy                 [array] [default: []]
  --name            Name                                     [string] [required]
  --preview-dir     The working preview directory    [default: "charts/preview"]
  --repo-host, -h   Chart Museum Repository to use
                         [string] [default: "http://jenkins-x-chartmuseum:8080"]
  --preset          Preset to deploy with Nuxeo    [string] [default: "default"]
  --namespace       Namespace (optional - computed by default)          [string]

Examples:
  index.ts preview --preview-dir            Deploy Preview from a given
  charts/preview                            directory
  index.ts preview --no-comment             Deploy Preview - without PR comment
  index.ts preview --namespace              Deploy Preview and override default
  $APP_NAME}-master --tag latest            namespace and Docker image tag
                                            versions
```

## Licensing

[Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)

## About Nuxeo

Nuxeo dramatically improves how content-based applications are built, managed and deployed, making customers more agile, innovative and successful. Nuxeo provides a next generation, enterprise ready platform for building traditional and cutting-edge content oriented applications. Combining a powerful application development environment with SaaS-based tools and a modular architecture, the Nuxeo Platform and Products provide clear business value to some of the most recognizable brands including Verizon, Electronic Arts, Sharp, FICO, the U.S. Navy, and Boeing. Nuxeo is headquartered in New York and Paris. More information is available at [www.nuxeo.com](http://www.nuxeo.com).
