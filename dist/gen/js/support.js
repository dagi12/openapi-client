"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTSParamType = exports.getDocType = exports.formatDocDescription = exports.applyFormatOptions = exports.ST = exports.SP = exports.DEFAULT_SP = exports.DOC = void 0;
const common_tags_1 = require("common-tags");
const chalk_1 = require("chalk");
exports.DOC = ' * ';
exports.DEFAULT_SP = '  ';
exports.SP = exports.DEFAULT_SP;
exports.ST = ''; // statement terminator
function applyFormatOptions(options) {
    switch (`${options.indent}`) {
        case 'tab':
        case '\t':
            exports.SP = '\t';
            break;
        case '4':
            exports.SP = '    ';
            break;
        case '2':
            exports.SP = '  ';
            break;
        case 'spaces':
        default:
            exports.SP = exports.DEFAULT_SP;
            break;
    }
    if (options.semicolon) {
        exports.ST = ';';
    }
}
exports.applyFormatOptions = applyFormatOptions;
function formatDocDescription(description) {
    return (description || '').trim().replace(/\n/g, `\n${exports.DOC}${exports.SP}`);
}
exports.formatDocDescription = formatDocDescription;
function getDocType(param) {
    if (!param) {
        return 'object';
    }
    else if (param.$ref) {
        const type = param.$ref.split('/').pop();
        return `module:types.${type}`;
    }
    else if (param.schema) {
        return getDocType(param.schema);
    }
    else if (param.type === 'array') {
        if (param.items.type) {
            return `${getDocType(param.items)}[]`;
        }
        else if (param.items.$ref) {
            const type = param.items.$ref.split('/').pop();
            return `module:types.${type}[]`;
        }
        else {
            return 'object[]';
        }
    }
    else if (param.type === 'integer') {
        return 'number';
    }
    else if (param.type === 'string' &&
        (param.format === 'date-time' || param.format === 'date')) {
        return 'date';
    }
    else {
        return param.type || 'object';
    }
}
exports.getDocType = getDocType;
const primitives = new Set(['string', 'number', 'boolean']);
function getTSParamType(param, inTypesModule, indent = exports.SP) {
    if (!param) {
        console.warn((0, chalk_1.yellow)('Missing type information.'));
        return 'any';
    }
    else if (param.enum) {
        if (!param.type || param.type === 'string')
            return `'${param.enum.join(`'|'`)}'`;
        else if (param.type === 'number')
            return `${param.enum.join(`|`)}`;
    }
    if (param.$ref) {
        const type = param.$ref.split('/').pop();
        return inTypesModule ? type : `api.${type}`;
    }
    else if (param.schema) {
        return getTSParamType(param.schema, inTypesModule, indent);
    }
    else if (param.type === 'array') {
        if (!param.items) {
            console.warn((0, chalk_1.yellow)('Missing type information:'), param);
            return 'any[]';
        }
        if (param.items.type) {
            if (param.items.enum) {
                return `(${getTSParamType(param.items, inTypesModule, indent)})[]`;
            }
            else {
                return `${getTSParamType(param.items, inTypesModule, indent)}[]`;
            }
        }
        else if (param.items.$ref) {
            const type = param.items.$ref.split('/').pop();
            return inTypesModule ? `${type}[]` : `api.${type}[]`;
        }
        else if (param.items.oneOf) {
            return `(${param.items.oneOf
                .map((schema) => getTSParamType(schema, inTypesModule, indent))
                .map((type) => `${type}`)
                .join(' | ')})[]`;
        }
        else {
            console.warn((0, chalk_1.yellow)('Missing type information:'), param);
            return 'any[]';
        }
    }
    else if (param.type === 'object') {
        if (param.additionalProperties) {
            const extraProps = param.additionalProperties;
            return `{[key: string]: ${getTSParamType(extraProps, inTypesModule, indent)}}`;
        }
        if (param.properties) {
            const props = Object.keys(param.properties);
            return (0, common_tags_1.commaLists) `{
  ${indent}${props.map((key) => `${getKey(key, param)}: ${getTSParamType(param.properties[key], inTypesModule, `${indent}${exports.SP}`)}`)}
${indent}}`;
        }
        console.warn((0, chalk_1.yellow)('Missing type information:'), param);
        return 'any';
    }
    else if (Array.isArray(param.oneOf)) {
        return param.oneOf
            .map((schema) => getTSParamType(schema, inTypesModule, indent))
            .join(' | ');
    }
    else if (param.type === 'integer') {
        return 'number';
    }
    else if (param.type === 'file') {
        return 'File';
    }
    else if (primitives.has(param.type)) {
        return param.type;
    }
    else if (Array.isArray(param.type) &&
        param.type.length === 2 &&
        param.type[1] === 'null') {
        return getTSParamType({ ...param, type: param.type[0] }, inTypesModule, indent);
    }
    else {
        // No body returned.
        if (param.code === '204' || (param.code && param.code.startsWith('3'))) {
            return 'undefined';
        }
        console.warn((0, chalk_1.yellow)('Missing type information:'), param);
        return 'any';
    }
}
exports.getTSParamType = getTSParamType;
/**
 * Escape object key with quotation marks and add ? if it's optional.
 * @param key key name
 * @param schema the parameter defition
 */
function getKey(key, schema) {
    let suffix = '?';
    if (schema &&
        Array.isArray(schema.required) &&
        schema.required.includes(key)) {
        suffix = '';
    }
    if (key.match(/^[a-z0-9_]+$/i)) {
        return `${key}${suffix}`;
    }
    return `'${key}'${suffix}`;
}
