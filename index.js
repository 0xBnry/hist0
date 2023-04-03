const fs = require('fs');
const { exec } = require('child_process');

const historyPath = '.an_changelog_meta/CHANGELOG_HISTORY.log';
const changesPath = '.an_changelog_meta';

const timestamp = `[${new Date(Date.now()).toUTCString()}] `;
const history = [];

/**
 * Write a message to the internal history
 * @param {string} message Message to log
 */
const log = (message) => {
    history.push(`${timestamp}${message}`);
    console.log(`${timestamp}${message}`);
}

/**
 * Flush the history to the CHANGELOG_HISTORY.log file
 */
const flushLog = () => {
    const content = fs.readFileSync(historyPath, 'utf8');
    const l = `${history.join('\n')}\n\n${content}`
    fs.writeFileSync(historyPath, l);
}

/**
 * Execute a command async
 * @param {string} command cmd command to execute
 * @returns Promise with the stdout of the command
 */
const execAsync = async (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if(err) {
                reject(err);
            }

            resolve(stdout);
        });
    });
}

/**
 * Set the git email globally
 * @param {string} email Email to set
 * @returns Promise with the stdout of the command
 * @throws Error if no email is provided
 */
const setGitEmail = async (email) => {
    if(!email) throw new Error('No email provided');
    log(`Set git email to ${email}`);
    return execAsync(`git config --global user.email "${email}"`);
}

/**
 * Set the git name globally
 * @param {string} name Name to set
 * @returns Promise with the stdout of the command
 * @throws Error if no name is provided
 */
const setGitName = async (name) => {
    if(!name) throw new Error('No name provided');
    log(`Set git name to ${name}`);
    return execAsync(`git config --global user.name "${name}"`);
}

const checkDetachedMode = async () => {
    const res = await execAsync('git status');
    const isDetached = res.match(/.*detached.*/);
    return isDetached;
}

/**
 * Add the changes to the git repository
 * @returns Promise with the stdout of the command
 */
const addChanges = async () => {
    log('Add changes to git');
    return execAsync('git add .');
}

/**
 * Commit the changes to the git repository
 * @param {string} message Commit message
 * @throws Error if no message is provided
 * @returns Stdout of the command
 */
const commitChanges = async (message) => {
    if(!message) throw new Error('No commit message provided');
    return execAsync(`git commit -m "${message}"`);
}

/**
 * Push the changes to the git repository
 * @returns Promise with the stdout of the command
 */
const pushChanges = async () => {
    const res = [];
    if(await checkDetachedMode()) {
        res.push(await execAsync('git fetch'));
        res.push(await execAsync('git switch -c temp-changelog'));
        res.push(await execAsync('git switch master'));
        res.push(await execAsync('git merge temp-changelog --no-edit'));
        res.push(await execAsync('git push'));
    } else {
        res.push(await execAsync('git push'));
    }
    
    return res;
}

/**
 * Extracts the meta data from the Markdown content and clean the content afterwards
 * @param {string} content Markdown content containing meta data
 * @returns Tuple with Metadata and cleaned Markdown content
 */
const extractMetaData = (content) => {
    const regex = /---([\s\S]*?)---/gm;
    const found = content.match(regex);
    const metaData = found[0].replace(/---/g, '');
    const result = content.replace(regex, '');
    return [metaData, result];
}

/**
 * Extract the `added`, `changed` and `fixed` section from the Markdown content
 * @param {string} content Markdown content containing the changelog
 * @returns Tuple with the added, changed and fixed changelog
 */
const extractChangeLog = (content, delimiter = '#') => {
    return content.split(delimiter)
    .map(s => s.replace(/Added|Changed|Fixed\n/, ''))
    .map(s => s.replace(/(\n\n|\n)-/, '-'))
    .map(s => s.replace(/^\W/, ''))
    .map(s => s.replace(/\n+$/, '\n'))
    .filter(line => !line.match(/^\n+$/))
}

/**
 * Map the key-value pairs to an object
 * @param {string} metaData stringified key-value pair example: 'key: value'
 * @returns Object with the key-values mapped
 */
const convertToObject = (metaData) => {
    const pair = metaData.split('\n').filter(s => s.length > 0);
    const obj = {};
    
    for(const s of pair) {
        const [key, value] = s.split(':');
        obj[key] = value.replace(/\W/, '');
    }

    return obj;
}

/**
 * Read the arguments from the command line
 * @returns Object with the arguments
 */
const getArgs = () => {
    const args = process.argv.filter(arg => arg.match(/--.+=.+/));
    const obj = {};
    args.forEach(arg => {
        const [key, value] = arg.replace("--", "").split('=');
        obj[key] = value;
    });
    return obj;
}

/**
 * Get the changelog from the .an_changelog_meta folder
 * @returns Tuple with the added, changed and fixed changelog
 */
const getChangeLog = () => {
    if(!fs.existsSync(changesPath)) {
        fs.mkdirSync(changesPath);
    }

    const toadd = fs.readdirSync(changesPath).filter(file => file.match(/.md/));

    const added = [];
    const changed = [];
    const fixed = [];

    // Loop through all files of 'toadd' and add them to the changelog
    toadd.forEach(file => {
        const fileContent = fs.readFileSync(`${changesPath}/${file}`, 'utf8');
        log(`Add ${file} to changelog`);
        const [meta, content] = extractMetaData(fileContent);
        
        const metaData = convertToObject(meta);

        for(const key in metaData) {
            const data = metaData[key];
            log(`\t${key}: ${data}`);
        }


        const [a, c, f] = extractChangeLog(content);
        
        if(a && a.length) {
            added.push(a);
        }

        if(c && c.length) {
            changed.push(c);
        }

        if(f && f.length) {
            fixed.push(f);
        }
    });

    return [added, changed, fixed];
}

/**
 * Clean the `.an_changelog_meta` folder
 */
const cleanChangeMeta = () => {
    const toadd = fs.readdirSync(changesPath).filter(file => file.match(/.md/));
    toadd.forEach(file => {
        fs.rmSync(`${changesPath}/${file}`);
    });
}

/**
 * Generate a changelog from the .an_changelog_meta folder
 * @remarks Generate a Changelog entry from all files contained in the .an_changelog_meta folder. Automatically append the changelog to the CHANGELOG.md file. Add the changes to the git repository and commit them.
 * @example node generate.changelog.js --debug=true --user="user.name@domain.com" --name="User Name"
 */
const main = async () => {

    const args = getArgs();

    const debugMode = args['debug'] === 'true' || false;
    const user = args['user'] || 'devops.pipeline@example.com';
    const name = args['name'] || 'DevOps Pipeline';

    log('Initialize git');
    if(!debugMode) {
        const emailResult = await setGitEmail(user);
        if(emailResult != '') log(emailResult);

        const nameResult = await setGitName(name);
        if(nameResult != '') log(nameResult);
    } 

    log(`Start generating changelog`);

    const [added, changed, fixed] = getChangeLog();
    log(`Added ${added.length} entries to 'Added' section`);
    log(`Added ${changed.length} entries to 'Changed' section`);
    log(`Added ${fixed.length} entries to 'Fixed' section`);

    if(added.length === 0 && changed.length === 0 && fixed.length === 0) {
        log(`No changes found. Exit`);
        return;
    }

    const content = fs.readFileSync('CHANGELOG.md', 'utf8');
    const latestSection = content.split(/##\s\[\d.\d.\d\]/).slice(1).shift().replace(/-/, '');

    const [a, c, f] = extractChangeLog(latestSection, '###');

    const newAdded = `${a}${added.join('')}`;
    const newChanged = `${c}${changed.join('')}`;
    const newFixed = `${f}${fixed.join('')}`;

    const newContent = content.replace(a, newAdded).replace(c, newChanged).replace(f, newFixed);

    if(!debugMode) {
        fs.writeFileSync('CHANGELOG.md', newContent);
        log(`Wrote new changelog to 'CHANGELOG.md'`);

        cleanChangeMeta();
        log(`Cleaned '.an_changelog_meta' folder`);

        flushLog();

        const addResult = await addChanges();
        console.log(addResult);

        const commitResult = await commitChanges(':memo: :loud_sound: auto-update changelog [skip ci]');
        console.log(commitResult);

        const pushResult = await pushChanges();
        console.log(pushResult);
    }
}

/***************************
*  Generate the changelog **
****************************/

main();