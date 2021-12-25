"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var dotenv_1 = require("dotenv");
var node_vault_1 = (0, tslib_1.__importDefault)(require("node-vault"));
var path_1 = (0, tslib_1.__importDefault)(require("path"));
var fs_1 = (0, tslib_1.__importDefault)(require("fs"));
var chalk_1 = (0, tslib_1.__importDefault)(require("chalk"));
var VaultEnv = /** @class */ (function () {
    /**
     * @param endpoint
     * @param auth
     */
    function VaultEnv(endpoint, auth) {
        this.vault = (0, node_vault_1.default)({ endpoint: endpoint });
        if (auth.provider === 'github') {
            this.client = this.vault.githubLogin({ token: auth.token });
        }
    }
    /**
     * Writes fetched secret values to file, using template file with env variable keys and secret paths as values
     * @param from
     * @param to
     */
    VaultEnv.prototype.populate = function (from, to) {
        var _this = this;
        var distPath = path_1.default.resolve(from);
        var envPath = path_1.default.resolve(to);
        var existingValues = fs_1.default.existsSync(envPath) ? (0, dotenv_1.config)({ path: envPath }).parsed : {};
        fs_1.default.writeFileSync(envPath, '# Autogenerated by vault-env \n');
        if (distPath) {
            var template_1 = (0, dotenv_1.config)({ path: distPath }).parsed;
            if (template_1) {
                Object.entries(template_1)
                    .sort(function (a, b) { return (a[0] > b[0] ? 1 : -1); })
                    .forEach(function (_a) {
                    var key = _a[0], value = _a[1];
                    console.log("Setting ".concat(chalk_1.default.cyan(key), " from ").concat(chalk_1.default.green(value)));
                    _this.readSecret(value).then(function (secret) {
                        return secret
                            ? fs_1.default.appendFile(envPath, "".concat(key, "=").concat(secret, "\n"), function (error) { return error && console.log(chalk_1.default.red(error)); })
                            : chalk_1.default.yellow("Failed to fetch ".concat(value));
                    });
                });
            }
            else {
                console.log(chalk_1.default.red('No template provided'));
            }
            fs_1.default.writeFileSync(envPath, '# Custom variables \n');
            Object.entries(existingValues)
                .filter(function (it) { return template_1[it[0]] === undefined; })
                .forEach(function (_a) {
                var key = _a[0], value = _a[1];
                return fs_1.default.appendFileSync(envPath, "".concat(key, "=").concat(value, "\n"));
            });
        }
        else {
            throw new Error("No template file available at ".concat(distPath));
        }
    };
    /**
     * Reads secret by provided complete path to secret, including name, e.g. staging/database/username, where "staging" is key-value path
     * @param path
     */
    VaultEnv.prototype.readSecret = function (path) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function () {
            var chunks, root, searchKey, secretPath;
            var _this = this;
            return (0, tslib_1.__generator)(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        chunks = path.split('/');
                        root = chunks.shift();
                        searchKey = chunks.pop();
                        chunks.unshift(root, 'data');
                        secretPath = chunks.join('/');
                        return [4 /*yield*/, this.client
                                .then(function () { return _this.vault.read(secretPath); })
                                .then(function (secret) { return secret.data.data[searchKey]; })
                                .catch(function (reason) { return console.log(chalk_1.default.red(reason)); })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return VaultEnv;
}());
exports.default = VaultEnv;
