import { FreightHistoryService } from '../src/services/FreightHistoryService';

async function test() {
  const data = FreightHistoryService.getMultiRouteTrajectory();
  console.log('Points count:', data.length);
  console.log('Sample points:', data.slice(0, 3));
  console.log('Last point:', data[data.length - 1]);
}

test();
