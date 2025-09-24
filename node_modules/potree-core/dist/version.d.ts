export declare class Version {
    version: string;
    versionMajor: number;
    versionMinor: number;
    constructor(version: string);
    /**
     * Checks if this version is newer than the given version.
     *
     * @param version - The version to compare against.
     * @returns True if this version is newer than the given version, false otherwise.
     */
    newerThan(version: string): boolean;
    /**
     * Checks if this version is equal or higher than the given version.
     *
     * @param version - The version to compare against.
     * @returns True if this version is equal or higher than the given version, false otherwise.
     */
    equalOrHigher(version: string): boolean;
    /**
     * Checks if this version is equal or lower than the given version.
     *
     * @param version - The version to compare against.
     * @returns True if this version is equal or lower than the given version, false otherwise.
     */
    upTo(version: string): boolean;
}
