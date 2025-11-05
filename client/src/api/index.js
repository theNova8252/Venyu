import { IS_DEMO } from '@/config/mode';
import { demoAPI } from './mock';
import { realAPI } from './real';

export const api = IS_DEMO ? demoAPI : realAPI;
