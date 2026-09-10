import { Ndef } from 'react-native-nfc-manager';

export function encodeCopiedRecords(records) {
  // Normalize the native byte arrays without decoding payloads or losing record IDs.
  return Ndef.encodeMessage(
    records.map((record) =>
      Ndef.record(
        record.tnf,
        typeof record.type === 'string' ? record.type : Array.from(record.type ?? []),
        Array.from(record.id ?? []),
        Array.from(record.payload ?? []),
      ),
    ),
  );
}
