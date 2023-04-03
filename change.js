const fs = require('fs');

const changesPath = '.an_changelog_meta';

const randomString = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const content = `---
author: <Your name>
---

# Added

# Changed

# Fixed
`;

if(!fs.existsSync(changesPath)) {
    fs.mkdirSync(changesPath);
}

fs.writeFileSync(`${changesPath}/${randomString(8)}.md`, content);