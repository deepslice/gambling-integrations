import { register } from 'tsconfig-paths';
import tsConfig from './tsconfig.json';
import * as path from 'path';

const baseUrl = path.join('dist', tsConfig.compilerOptions.baseUrl);
register({
    baseUrl,
    paths: tsConfig.compilerOptions.paths
});
