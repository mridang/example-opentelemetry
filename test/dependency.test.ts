import fs from 'fs';
import path from 'path';
import { test, describe, expect } from '@jest/globals';

interface PackageLock {
  name: string;
  version: string;
  lockfileVersion: number;
  requires: boolean;
  packages: Record<string, PackageDependency>;
}

interface PackageDependency {
  version: string;
  resolved: string;
  integrity: string;
  dev?: boolean;
  dependencies?: Record<string, string>;
}

/**
 * Reads and parses the package-lock.json file to find dependencies.
 * Filters out development dependencies and catalogs the remaining ones.
 * Identifies and returns dependencies that have multiple versions.
 *
 * The process consists of the following steps:
 * 1. Read and parse the package-lock.json file.
 * 2. Filter out any dependencies marked as development dependencies.
 * 3. Flatten the dependencies into a simple array of objects containing
 *    the name and version of each dependency.
 * 4. Aggregate these dependencies into a catalog, grouping them by their
 *    name and ensuring that only unique versions are recorded.
 * 5. Identify dependencies that have more than one version.
 *
 * @returns {Promise<Record<string, { name: string, version: string }[]>>}
 *          A promise that resolves to a record where the keys are dependency
 *          names and the values are arrays of dependency versions that
 *          have multiple occurrences.
 *
 * @example
 * If package-lock.json contains:
 * ```json
 * {
 *   "name": "example",
 *   "version": "1.0.0",
 *   "packages": {
 *     "": {
 *       "dev": true,
 *       "version": "1.0.0"
 *     },
 *     "node_modules/@example/dependency1": {
 *       "version": "1.0.0"
 *     },
 *     "node_modules/@example/dependency1": {
 *       "version": "2.0.0"
 *     },
 *     "node_modules/@example/dependency2": {
 *       "version": "1.0.0",
 *       "dev": true
 *     }
 *   }
 * }
 * ```
 *
 * The function will return:
 * ```json
 * {
 *   "@example/dependency1": [
 *     { "name": "@example/dependency1", "version": "1.0.0" },
 *     { "name": "@example/dependency1", "version": "2.0.0" }
 *   ]
 * }
 * ```
 */
async function findDuplicateDependencies(): Promise<
  Record<string, { name: string; version: string }[]>
> {
  const packageLockJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../package-lock.json'), 'utf-8'),
  ) as PackageLock;

  const catalog = Object.entries(packageLockJson.packages || {})
    .filter(([, dep]) => !dep.dev) // Step 2: Filter out dev dependencies
    .flatMap(([path, dep]) => {
      const name = path.split('node_modules/').pop();
      return name ? [{ name, version: dep.version }] : []; // Step 3: Flatten dependencies
    })
    .reduce(
      (acc, { name, version }) => ({
        ...acc,
        [name]:
          acc[name] && acc[name].some((pack) => pack.version === version)
            ? acc[name]
            : [...(acc[name] || []), { name, version }], // Step 4: Aggregate into catalog
      }),
      {} as Record<string, { name: string; version: string }[]>,
    );

  return Object.entries(catalog).reduce(
    (
      acc: Record<string, { name: string; version: string }[]>,
      [name, occurrences],
    ) => (occurrences.length > 1 ? { ...acc, [name]: occurrences } : acc), // Step 5: Identify duplicates
    {} as Record<string, { name: string; version: string }[]>,
  );
}

describe('duplicate.dependencies test', () => {
  let duplicates: Record<string, { name: string; version: string }[]>;

  beforeAll(async () => {
    duplicates = await findDuplicateDependencies();
  });

  test.each(['@aws-sdk', '@smithy', '@sentry', '@opentelemetry'])(
    'should not have duplicate %s dependencies',
    (dependencyPrefix) => {
      const duplicateDeps = Object.keys(duplicates).filter((dep) =>
        dep.startsWith(dependencyPrefix),
      );
      try {
        expect(duplicateDeps.length).toBe(0);
      } catch {
        throw new Error(
          `Found duplicate versions for ${duplicateDeps.join(', ')}`,
        );
      }
    },
  );
});
