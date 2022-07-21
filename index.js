import alfy from 'alfy';
import Lastpass from 'lastpass';

const USERNAME = process.env.LAST_PASS_LITE_USERNAME;
const PWD = process.env.LAST_PASS_LITE_PWD;
const VAULT_FILE_PATH = `${getUserRootFolder()}/.lastpass_lite_vault_file`
const VAULT_FILE_EXPIRATION_CACHE_KEY = 'VAULT_FILE_EXPIRATION_CACHE_KEY';

function removeUnicodeChar(str) {
    return str.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');
}

function getUserRootFolder() {
    return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

function accountSearchHelper(account, query) {
    const queryLowerCase = query.toLowerCase();
    return account.url.toLowerCase().includes(queryLowerCase) 
        || account.name.toLowerCase().includes(queryLowerCase) 
        || account.username.toLowerCase().includes(queryLowerCase);
}

async function loadVault(lpass) {
    const expiredFlag = alfy.cache.get(VAULT_FILE_EXPIRATION_CACHE_KEY);
    if (expiredFlag) {
        await lpass.loadVaultFile(VAULT_FILE_PATH);
    } else {
        await lpass.loadVault(USERNAME, PWD);
        alfy.cache.set(VAULT_FILE_EXPIRATION_CACHE_KEY, VAULT_FILE_EXPIRATION_CACHE_KEY, {maxAge: 25200000})
    }
}

async function initLastPassVault() {
    const lpass = new Lastpass.default();
    await loadVault(lpass);
    return lpass;
}

async function getAccounts(lpass, query) {
    return (await lpass.getAccounts(USERNAME, PWD))
        .filter(item => accountSearchHelper(item, query))
        .map(item => ({
            title: removeUnicodeChar(item.username),
            subtitle: removeUnicodeChar(`${item.name}(${item.url})`),
            arg: removeUnicodeChar(item.password)
        }))
}

async function main() {
    try {
        const lpass = await initLastPassVault();
        alfy.output(await getAccounts(lpass, alfy.input));
        await lpass.saveVaultFile(VAULT_FILE_PATH);
    } catch(err) {
        console.log(err)
    }
}

if (USERNAME && PWD) {
    main()
} else {
    alfy.error('Lastpass username and password cannot be found through environment variables.')
}