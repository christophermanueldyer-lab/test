/**
 * Email Tracker - Tracks emails that were reported as "not filtered"
 * to avoid reporting them again in future runs
 */

const TRACKER_PROPERTY_KEY = 'NOT_FILTERED_EMAILS';
const MAX_TRACKED_EMAILS = 500; // Limit to prevent property size issues
const EXPIRY_DAYS = 7; // Remove tracked emails older than 7 days

/**
 * Check if an email was previously reported as "not filtered"
 *
 * @param {string} messageId - Gmail message ID
 * @return {boolean} True if already reported
 */
function wasReportedAsNotFiltered(messageId) {
  const tracked = getTrackedEmails();
  return tracked.hasOwnProperty(messageId);
}

/**
 * Mark an email as "not filtered" so it won't be reported again
 *
 * @param {string} messageId - Gmail message ID
 */
function markAsNotFiltered(messageId) {
  const tracked = getTrackedEmails();

  // Add new entry with current timestamp
  tracked[messageId] = new Date().getTime();

  // Clean up old entries
  cleanupTrackedEmails(tracked);

  // Save back to properties
  saveTrackedEmails(tracked);
}

/**
 * Get all tracked emails from Script Properties
 *
 * @return {Object} Object mapping message IDs to timestamps
 */
function getTrackedEmails() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const data = properties.getProperty(TRACKER_PROPERTY_KEY);

    if (!data) {
      return {};
    }

    return JSON.parse(data);

  } catch (error) {
    Logger.log(`Error getting tracked emails: ${error.toString()}`);
    return {};
  }
}

/**
 * Save tracked emails to Script Properties
 *
 * @param {Object} tracked - Object mapping message IDs to timestamps
 */
function saveTrackedEmails(tracked) {
  try {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty(TRACKER_PROPERTY_KEY, JSON.stringify(tracked));

  } catch (error) {
    Logger.log(`Error saving tracked emails: ${error.toString()}`);

    // If we hit the property size limit, force cleanup
    if (error.toString().includes('exceed')) {
      Logger.log('Property size limit reached, forcing cleanup');
      const cleaned = {};
      const entries = Object.entries(tracked);

      // Keep only the most recent entries
      entries
        .sort((a, b) => b[1] - a[1]) // Sort by timestamp descending
        .slice(0, Math.floor(MAX_TRACKED_EMAILS / 2))
        .forEach(([id, timestamp]) => {
          cleaned[id] = timestamp;
        });

      properties.setProperty(TRACKER_PROPERTY_KEY, JSON.stringify(cleaned));
    }
  }
}

/**
 * Remove old and excess entries from tracked emails
 *
 * @param {Object} tracked - Object mapping message IDs to timestamps
 */
function cleanupTrackedEmails(tracked) {
  const now = new Date().getTime();
  const expiryTime = EXPIRY_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds

  // Remove expired entries
  Object.keys(tracked).forEach(messageId => {
    const timestamp = tracked[messageId];
    if (now - timestamp > expiryTime) {
      delete tracked[messageId];
    }
  });

  // If still too many entries, keep only the most recent ones
  const entries = Object.entries(tracked);
  if (entries.length > MAX_TRACKED_EMAILS) {
    const toKeep = {};

    entries
      .sort((a, b) => b[1] - a[1]) // Sort by timestamp descending
      .slice(0, MAX_TRACKED_EMAILS)
      .forEach(([id, timestamp]) => {
        toKeep[id] = timestamp;
      });

    // Clear and replace tracked object
    Object.keys(tracked).forEach(key => delete tracked[key]);
    Object.assign(tracked, toKeep);
  }
}

/**
 * Manually clear all tracked emails
 * Run this if you want to reset the tracking system
 */
function clearTrackedEmails() {
  const properties = PropertiesService.getScriptProperties();
  properties.deleteProperty(TRACKER_PROPERTY_KEY);
  Logger.log('All tracked emails cleared');
}

/**
 * Get statistics about tracked emails
 */
function getTrackerStats() {
  const tracked = getTrackedEmails();
  const count = Object.keys(tracked).length;
  const now = new Date().getTime();

  // Calculate age distribution
  const ages = Object.values(tracked).map(timestamp => {
    return Math.floor((now - timestamp) / (24 * 60 * 60 * 1000)); // Days
  });

  const avgAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
  const oldestAge = ages.length > 0 ? Math.max(...ages) : 0;

  Logger.log(`Tracked Emails Stats:`);
  Logger.log(`  Total tracked: ${count}`);
  Logger.log(`  Average age: ${avgAge.toFixed(1)} days`);
  Logger.log(`  Oldest entry: ${oldestAge} days`);
  Logger.log(`  Expiry threshold: ${EXPIRY_DAYS} days`);
  Logger.log(`  Max capacity: ${MAX_TRACKED_EMAILS}`);

  return {
    count,
    avgAge,
    oldestAge,
    expiryDays: EXPIRY_DAYS,
    maxCapacity: MAX_TRACKED_EMAILS
  };
}
