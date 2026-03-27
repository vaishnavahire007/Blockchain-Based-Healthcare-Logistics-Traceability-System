const Batch = require('../models/Batch');

const startTemperatureSimulation = () => {
  console.log('[IoT Daemon] Temperature hardware simulator initialized (10s intervals)...');

  // Trigger explicit interval exactly every 10000ms sequentially
  setInterval(async () => {
    try {
      // Fetching all currently active payload entities. 
      // (Optimized safely to explicitly exclude 'delivered' to heavily prevent infinite 16mb MongoDB Array cap overflows)
      const batches = await Batch.find({ status: { $ne: 'delivered' } });
      
      if (batches.length === 0) return;

      // Extremely efficient mapping pattern: generating independent floats dynamically per ID
      const bulkOps = batches.map(batch => {
        const tempValue = parseFloat((Math.random() * 10 + 2).toFixed(1));
        
        const updateDoc = {
          $push: {
            temperatureLogs: {
              value: tempValue,
              timestamp: new Date()
            }
          }
        };

        if (tempValue > batch.temperatureThreshold) {
          updateDoc.$set = { isSafe: false };
        }

        return {
          updateOne: {
            filter: { _id: batch._id },
            update: updateDoc
          }
        };
      });

      // Pushing hundreds of records to the Blockchain simultaneously minimizing I/O Node threading usage to 1 connection
      if (bulkOps.length > 0) {
        await Batch.bulkWrite(bulkOps);
        // Silent log to prevent console flooding while running identically in background
        // console.log(`[IoT Simulation] Broadcast successfully reached ${bulkOps.length} payloads.`);
      }
    } catch (error) {
      console.error('[IoT Daemon] Fatal error pinging hardware logistics:', error.message);
    }
  }, 10000); 
};

module.exports = startTemperatureSimulation;
