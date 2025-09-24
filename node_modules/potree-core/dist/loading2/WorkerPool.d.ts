/**
 * Enumerates the types of workers available in the worker pool.
 */
export declare enum WorkerType {
    /**
     * Worker for decoding Brotli-compressed data.
     */
    DECODER_WORKER_BROTLI = "DECODER_WORKER_BROTLI",
    /**
     * Worker for general decoding tasks.
     */
    DECODER_WORKER = "DECODER_WORKER"
}
/**
 * WorkerPool manages a collection of worker instances, allowing for efficient retrieval and return of workers based on their type.
 */
export declare class WorkerPool {
    /**
     * Workers will be an object that has a key for each worker type and the value is an array of Workers that can be empty.
     */
    workers: {
        [key in WorkerType]: Worker[];
    };
    /**
     * Retrieves a Worker instance from the pool associated with the specified worker type.
     *
     * If no worker instances are available, a new worker is created and added to the pool before retrieving one.
     *
     * @param workerType - The type of the worker to retrieve.
     * @returns A Worker instance corresponding to the specified worker type.
     * @throws Error if the worker type is not recognized or if no workers are available in the pool.
     */
    getWorker(workerType: WorkerType): Worker;
    /**
     * Returns a worker instance to the pool for the specified worker type.
     *
     * @param workerType - The type of the worker, which determines the corresponding pool.
     * @param worker - The worker instance to be returned to the pool.
     */
    returnWorker(workerType: WorkerType, worker: Worker): void;
}
