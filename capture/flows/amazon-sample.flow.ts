// Amazon Shipping sample (QA store mcsl-automation-amazon, CAPTURE_ALLOW_QA=1 VIDEO_CARRIER=amazon-sample).
// Captures for carriers/amazon-sample/shots.yaml: the shared labels tour (flows/common/labels-tour.ts).
// Amazon Shipping is domestic only (KB: no cross-border), so the demo orders use the env's default
// address, which is in the store's country.
import { labelsTour } from './common/labels-tour';

labelsTour({ address: 'default' });
