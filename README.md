# Hist0

having multiple developers in a project can be sometimes difficult when it comes to `changelog` updates.
This script can help you organize your changelog and avoid merge conflicts during pull requests.

- [Hist0](#hist0)
  - [Detailed description](#detailed-description)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
    - [Script installation](#script-installation)
    - [CI/CD](#cicd)
  - [Usage](#usage)
  - [Variable Reference](#variable-reference)
  - [Contribute](#contribute)

## Detailed description

Hist0 generates a folder called `.an_changelog_meta` (so it will be on the top of the file tree).
Within the directory there will be multiple `*.md` files containing changes from different developers.
Each file is one change of a developer (to avoid merge conflicts).

The azure pipeline runs on each change of the **main**-branch (or what name you decide) and generates a changelog entry out of the given files.

Afterwards the script automatically deletes all files containing the changelog-metadata.

The scripts also creates a entry on the changelog-history file for archiving access and changes.

## Prerequisites

- Have `NodeJS` installed.
- Have a `CHANGELOG.md` file in the root of the repository. (Use the `CHANGELOG.md` file of this repository as reference)
- Build Service Account (in Azure DevOps) has permission to push (Contribute permission needed).

## Installation

In order to install the generator script, two steps need to be done.

### Script installation

for the script itself just copy the `change.js` and `index.js` files from this repository to any destination within your repository. Then add the `npm` scripts to your `package.json`. You can find an example in the `package.json` of this repository.

### CI/CD

for CI/CD you can use (at least for azure) the given pipeline within the `pipelines` folder.
Just adjust the path to the script.

## Usage

to ensure a given structure it is recommended to use the `change.js` script for generating a new changelog entry.

```sh
node change.js
```

After you have added the changes to the structure (and all metadata) you can run the changelog script (or let it run by the pipeline)

```sh
node index.js --user="your.email@example.com" --name="Your Name" --debug=false
```

## Variable Reference

**--user**
The E-Mail address you are also using in Git.
On the pipeline this will be automatically read from the predefined variables.

**--name**
The human readable name.
On the pipeline this will be automatically read from the predefined variables.

**--debug**
boolean value for debugging the script.
In debug mode there will be no `git commit` & `git push` to the repository.

## Contribute

This script is just a small snippet.
Feel free to copy it and use it as you like.
No warranty given - use on own risk.
