/**
 * Trial Service Factory
 * Creates TrialService instances with dependencies
 */

import { TrialService } from "./trial.service";

export function makeTrialService(): TrialService {
  return new TrialService();
}

