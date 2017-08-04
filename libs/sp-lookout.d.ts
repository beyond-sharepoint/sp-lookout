declare module "sp-lookout" {
    export interface BaristaUtils {
        arrayBufferToBase64(arrayBuffer: ArrayBuffer): string;
        base64ToArrayBuffer(base64: string): ArrayBuffer;
        async getItem(key: string): Promise<any>;
        isClass(obj: any): boolean;
        paths(obj: any): string;
        reportProgress(message: string, details?: any): void;
        async removeItem(key: string): Promise<void>;
        async setItem(key: string, value: any): Promise<void>;
    }
    export var spLookout: BaristaUtils;
}