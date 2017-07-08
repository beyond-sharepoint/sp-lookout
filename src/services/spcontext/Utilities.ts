export default class Utilities {

    /**
     * Utility function to convert an ArrayBuffer to a string.
     * @param buffer 
     */
    public static ab2str(buffer: ArrayBuffer): string {
        let result = '';
        let bytes = new Uint8Array(buffer);
        let len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            result += String.fromCharCode(bytes[i]);
        }
        return result;
    }

    /**
     * Utility function to convert a string to an ArrayBuffer
     * @param str 
     */
    public static str2ab(str: string): ArrayBuffer {
        let len = str.length;
        let bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = str.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Utility function to create a random string of characters of a given length.
     * @param length Desired length of the id
     */
    public static makeId(length: number): string {
        let text = '';
        let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }
}