import {
    getInitContractParameterSchema,
    getUpdateContractParameterSchema,
} from '../src/schemaHelpers';
import { Buffer } from 'buffer/';

const twoStepTransferSchema =
    'AQAAABEAAAB0d28tc3RlcC10cmFuc2ZlcgEUAAIAAAALAAAAaW5pdF9wYXJhbXMUAAMAAAAPAAAAYWNjb3VudF9ob2xkZXJzEQALHAAAAHRyYW5zZmVyX2FncmVlbWVudF90aHJlc2hvbGQCFAAAAHRyYW5zZmVyX3JlcXVlc3RfdHRsDggAAAByZXF1ZXN0cxIBBRQABAAAAA8AAAB0cmFuc2Zlcl9hbW91bnQKDgAAAHRhcmdldF9hY2NvdW50CwwAAAB0aW1lc19vdXRfYXQNCgAAAHN1cHBvcnRlcnMRAgsBFAADAAAADwAAAGFjY291bnRfaG9sZGVycxEACxwAAAB0cmFuc2Zlcl9hZ3JlZW1lbnRfdGhyZXNob2xkAhQAAAB0cmFuc2Zlcl9yZXF1ZXN0X3R0bA4BAAAABwAAAHJlY2VpdmUVAgAAAA8AAABSZXF1ZXN0VHJhbnNmZXIBAwAAAAUKCw8AAABTdXBwb3J0VHJhbnNmZXIBAwAAAAUKCw==';

test('Able to get init parameter schema', () => {
    const paramSchema = getInitContractParameterSchema(
        Buffer.from(twoStepTransferSchema, 'base64'),
        'two-step-transfer',
        0
    );
    expect(paramSchema.toString('base64')).toEqual(
        'FAADAAAADwAAAGFjY291bnRfaG9sZGVycxEACxwAAAB0cmFuc2Zlcl9hZ3JlZW1lbnRfdGhyZXNob2xkAhQAAAB0cmFuc2Zlcl9yZXF1ZXN0X3R0bA4='
    );
});

test('Able to get receive parameter schema', () => {
    const paramSchema = getUpdateContractParameterSchema(
        Buffer.from(twoStepTransferSchema, 'base64'),
        'two-step-transfer',
        'receive',
        0
    );
    expect(paramSchema.toString('base64')).toEqual(
        'FQIAAAAPAAAAUmVxdWVzdFRyYW5zZmVyAQMAAAAFCgsPAAAAU3VwcG9ydFRyYW5zZmVyAQMAAAAFCgs='
    );
});
