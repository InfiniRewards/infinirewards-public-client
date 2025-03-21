import { shortString } from 'starknet';
import { decode as decodeCbor } from 'cbor2';

// Custom JSON.stringify replacer to handle BigInt
const jsonReplacer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

export function byteArrayToString(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'toString' in value) return value.toString();
  
  // Try to decode as short string first
  try {
    return shortString.decodeShortString(value);
  } catch (shortStringError) {
    console.warn('Failed to decode short string, trying CBOR:', shortStringError);
    
    // Try to decode as CBOR
    try {
      const decodedValue = decodeCborMetadata(value);
      
      // Check if it's a Cairo byte array format
      if (isCairoByteArray(decodedValue)) {
        const cairoString = decodeCairoByteArrayContent(decodedValue);
        if (cairoString) return cairoString;
      }
      
      return typeof decodedValue === 'string' 
        ? decodedValue 
        : JSON.stringify(decodedValue, jsonReplacer);
    } catch (cborError) {
      console.warn('Failed to decode as CBOR:', cborError);
      
      // Last resort: check if it's a JSON object with Cairo byte array format
      if (typeof value === 'object' && isCairoByteArray(value)) {
        const cairoString = decodeCairoByteArrayContent(value);
        if (cairoString) return cairoString;
      }
      
      return String(value);
    }
  }
}

/**
 * Check if a value looks like a Cairo byte array representation
 */
export function isCairoByteArray(value: any): boolean {
  return (
    typeof value === 'object' && 
    value !== null &&
    'data' in value && 
    Array.isArray(value.data) &&
    ('pending_word' in value || 'pending_word_len' in value)
  );
}

/**
 * Decode a Cairo byte array representation to a string
 */
export function decodeCairoByteArray(byteArray: any): string | null {
  if (!isCairoByteArray(byteArray)) return null;
  
  try {
    // Extract the data fields from Cairo's byte array structure
    const { data, pending_word, pending_word_len } = byteArray;
    
    // Process full words from the data array
    let result = '';
    for (const wordFelt of data) {
      // Convert felt to hex string without '0x' prefix
      let wordHex = BigInt(wordFelt).toString(16);
      // Ensure even length
      if (wordHex.length % 2 !== 0) {
        wordHex = '0' + wordHex;
      }
      
      // Convert hex to bytes then to string
      const bytes = hexToBytes(wordHex);
      result += bytesToString(bytes);
    }
    
    // Process pending word if it exists
    if (pending_word && pending_word_len) {
      const pendingWordLen = parseInt(pending_word_len);
      if (pendingWordLen > 0) {
        let pendingHex = BigInt(pending_word).toString(16);
        // Ensure even length
        if (pendingHex.length % 2 !== 0) {
          pendingHex = '0' + pendingHex;
        }
        
        // Only take the relevant bytes based on pending_word_len
        const pendingBytes = hexToBytes(pendingHex).slice(0, pendingWordLen);
        result += bytesToString(pendingBytes);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error decoding Cairo byte array:', error);
    return null;
  }
}

/**
 * Decode a Cairo byte array and then decode its content as CBOR
 */
export function decodeCairoByteArrayContent(byteArray: any): string | any {
  if (!isCairoByteArray(byteArray)) return null;
  
  try {
    // Extract the data fields from Cairo's byte array structure
    const { data, pending_word, pending_word_len } = byteArray;
    
    // First, collect all bytes from the Cairo byte array
    let allBytes: number[] = [];
    
    // Process full words from the data array
    for (const wordFelt of data) {
      // Convert felt to hex string without '0x' prefix
      let wordHex = BigInt(wordFelt).toString(16);
      // Ensure even length
      if (wordHex.length % 2 !== 0) {
        wordHex = '0' + wordHex;
      }
      
      // Convert hex to bytes and add to our collection
      const bytes = hexToBytes(wordHex);
      for (let i = 0; i < bytes.length; i++) {
        allBytes.push(bytes[i]);
      }
    }
    
    // Process pending word if it exists
    if (pending_word && pending_word_len) {
      const pendingWordLen = parseInt(pending_word_len);
      if (pendingWordLen > 0) {
        let pendingHex = BigInt(pending_word).toString(16);
        // Ensure even length
        if (pendingHex.length % 2 !== 0) {
          pendingHex = '0' + pendingHex;
        }
        
        // Only take the relevant bytes based on pending_word_len
        const pendingBytes = hexToBytes(pendingHex).slice(0, pendingWordLen);
        for (let i = 0; i < pendingBytes.length; i++) {
          allBytes.push(pendingBytes[i]);
        }
      }
    }
    
    // Create Uint8Array from the collected bytes
    const byteData = new Uint8Array(allBytes);
    
    // For debugging: show the string representation of the bytes
    const stringRepresentation = bytesToString(byteData);
    console.log('Decoded Cairo byte array to string:', stringRepresentation);
    
    // Try to decode the bytes directly as CBOR
    try {
      // Decode the bytes as CBOR without re-encoding to string first
      const cborDecoded = decodeCbor(byteData);
      console.log('CBOR decoded content from Cairo byte array:', cborDecoded);
      
      // Return the CBOR decoded data
      return cborDecoded;
    } catch (cborError) {
      console.warn('Content of Cairo byte array is not valid CBOR:', cborError);
      // If CBOR decoding fails, return the string representation
      return stringRepresentation;
    }
  } catch (error) {
    console.error('Error decoding Cairo byte array content:', error);
    return null;
  }
}

/**
 * Convert a string of bytes to a readable string
 */
function bytesToString(bytes: Uint8Array): string {
  try {
    return new TextDecoder().decode(bytes);
  } catch (e) {
    // Fallback for older browsers
    let result = '';
    for (let i = 0; i < bytes.length; i++) {
      result += String.fromCharCode(bytes[i]);
    }
    return result;
  }
}

export function decodeCborMetadata(value: any): any {
  if (!value) return null;
  
  // Log the value type for debugging
  console.log('CBOR decode input type:', typeof value, value);
  
  // Create a Uint8Array from the input
  let bytes: Uint8Array | undefined;
  
  try {
    if (value instanceof Uint8Array) {
      bytes = value;
    } else if (Array.isArray(value)) {
      // Check if it's an array of numbers that can be converted to bytes
      const isValidByteArray = value.every(item => 
        typeof item === 'number' || 
        (typeof item === 'string' && !isNaN(Number(item)))
      );
      
      if (isValidByteArray) {
        bytes = new Uint8Array(value.map(item => Number(item)));
      } else {
        console.warn('Array contains non-numeric values, cannot decode as CBOR');
        throw new Error('Invalid byte array: contains non-numeric values');
      }
    } else if (typeof value === 'string') {
      // Handle hex strings
      if (/^(0x)?[0-9a-fA-F]+$/.test(value)) {
        const hexString = value.startsWith('0x') ? value.slice(2) : value;
        bytes = hexToBytes(hexString);
      } else {
        // If it's not a hex string, try to treat it as a UTF-8 string
        bytes = new TextEncoder().encode(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      // If it's already an object, it might be already decoded or in a different format
      return value;
    } else {
      throw new Error(`Unsupported value type for CBOR decoding: ${typeof value}`);
    }
    
    // Make sure bytes is defined before decoding
    if (!bytes) {
      throw new Error('Failed to convert input to bytes');
    }
    
    // Decode the CBOR data using the cbor2 library
    return decodeCbor(bytes);
  } catch (error: unknown) {
    console.error('Error in CBOR decoding process:', error);
    
    // For debugging: if bytes were created, show a sample
    if (bytes && bytes.length > 0) {
      console.log('First few bytes:', bytes.slice(0, Math.min(10, bytes.length)));
    }
    
    // Rethrow with more information
    if (error instanceof Error) {
      throw new Error(`CBOR decoding error: ${error.message}`);
    } else {
      throw new Error(`CBOR decoding error: ${String(error)}`);
    }
  }
}

// Helper function to convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    // Pad with leading zero if odd length
    hex = '0' + hex;
  }
  
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byteValue = parseInt(hex.substring(i, i + 2), 16);
    if (isNaN(byteValue)) {
      throw new Error(`Invalid hex string at position ${i}: ${hex.substring(i, i + 2)}`);
    }
    bytes[i / 2] = byteValue;
  }
  return bytes;
}