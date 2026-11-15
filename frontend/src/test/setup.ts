import '@testing-library/jest-dom/vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

// Extend the same expect instance imported by the tests when the WSL runner
// is loaded from a Linux-local dependency cache outside this checkout.
expect.extend(matchers);
afterEach(cleanup);
