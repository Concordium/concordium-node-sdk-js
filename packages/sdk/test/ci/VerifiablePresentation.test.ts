import {
    replaceDateWithTimeStampAttribute,
    reviveDateFromTimeStampAttribute,
} from '../../src/types/VerifiablePresentation.js';

const dateValue = '2023-08-24T15:15:29.000Z';
const timestamp = 1692890129000;
const withTimestamp = `{\"date\":{\"type\":\"date-time\",\"timestamp\":\"${dateValue}\"}}`;

test('replaceDateWithTimeStampAttribute', () => {
    const withDate = {
        date: new Date(timestamp),
    };
    const serialized = JSON.stringify(withDate, replaceDateWithTimeStampAttribute);
    expect(serialized).toBe(withTimestamp);
});

test('reviveDateFromTimeStampAttribute', () => {
    const parsed = JSON.parse(withTimestamp, reviveDateFromTimeStampAttribute);
    expect(parsed.date).toStrictEqual(new Date(timestamp));
});
